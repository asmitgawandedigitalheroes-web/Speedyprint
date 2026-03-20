import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAX_ROWS_DEFAULT = 5000

interface ValidationError { row: number; column: string; message: string }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { template_id, filename, parsed_data, column_mapping, row_count } = body

  // Basic presence validation
  if (!Array.isArray(parsed_data) || parsed_data.length === 0) {
    return NextResponse.json({ error: 'CSV must contain at least one data row.' }, { status: 400 })
  }
  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'Filename is required.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // ── Admin-configurable row limit ──────────────────────────────────────────
  let maxRows = MAX_ROWS_DEFAULT
  try {
    const { data: setting } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'csv_max_rows')
      .single()
    if (setting?.value) {
      const limit = parseInt(setting.value, 10)
      if (!isNaN(limit) && limit > 0) maxRows = limit
    }
  } catch { /* key may not exist yet — fall back to default */ }

  const actualRowCount = parsed_data.length
  if (actualRowCount > maxRows) {
    return NextResponse.json({
      error: `CSV exceeds maximum allowed rows. Uploaded ${actualRowCount} rows — maximum is ${maxRows}. Split your file and upload in batches.`,
      max_rows: maxRows,
      row_count: actualRowCount,
    }, { status: 400 })
  }

  // ── Template existence check ──────────────────────────────────────────────
  if (template_id) {
    const { data: tmpl } = await admin
      .from('product_templates')
      .select('id')
      .eq('id', template_id)
      .single()
    if (!tmpl) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    }
  }

  // ── Per-column format validation ──────────────────────────────────────────
  const formatErrors: ValidationError[] = []

  if (template_id && column_mapping && typeof column_mapping === 'object') {
    const { data: params } = await admin
      .from('template_parameters')
      .select('param_key, param_label, param_type, is_required')
      .eq('product_template_id', template_id)

    if (params && params.length > 0) {
      const paramMap = new Map(params.map((p) => [p.param_key, p]))

      for (let i = 0; i < parsed_data.length; i++) {
        const row = parsed_data[i] as Record<string, string>

        for (const [paramKey, csvHeader] of Object.entries(column_mapping as Record<string, string>)) {
          const param = paramMap.get(paramKey)
          if (!param) continue
          const rawVal = String(row[csvHeader] ?? '').trim()

          // Required: must not be empty
          if (param.is_required && rawVal === '') {
            formatErrors.push({ row: i + 2, column: param.param_label, message: 'Required field is empty' })
            continue
          }
          if (rawVal === '') continue

          // Number/range fields must be numeric
          if (param.param_type === 'number' || param.param_type === 'range') {
            if (isNaN(Number(rawVal))) {
              formatErrors.push({ row: i + 2, column: param.param_label, message: `Expected a number, got "${rawVal}"` })
            }
          }

          // Text fields: max 500 chars
          if (param.param_type === 'text' && rawVal.length > 500) {
            formatErrors.push({ row: i + 2, column: param.param_label, message: `Text too long (${rawVal.length} chars, max 500)` })
          }
        }
      }
    }
  }

  // Return all format errors so the UI can display them before creating the job
  if (formatErrors.length > 0) {
    return NextResponse.json({
      error: `Validation failed: ${formatErrors.length} error(s) found in CSV data.`,
      validation_errors: formatErrors,
    }, { status: 422 })
  }

  // ── Persist job ───────────────────────────────────────────────────────────
  const enrichedMapping = template_id
    ? { _template_id: template_id, ...column_mapping }
    : column_mapping

  const { data, error } = await admin
    .from('csv_jobs')
    .insert({
      user_id: user.id,
      original_filename: filename,
      parsed_data,
      column_mapping: enrichedMapping,
      row_count: actualRowCount,
      status: 'validated',
      progress: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

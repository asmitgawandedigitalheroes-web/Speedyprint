import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RouteParams = { params: Promise<{ id: string }> }

// ── GET /api/admin/csv/:id ────────────────────────────────────────────────────
// Returns parsed_data (paginated), column_mapping, and metadata for a CSV job.
// Uses admin client so it works for both 'admin' and 'production_staff' roles,
// bypassing the RLS policy that only permits role='admin' on the csv_jobs table.
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Auth guard: admin or production_staff only
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'production_staff'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Pagination params
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(500, parseInt(searchParams.get('limit') ?? '100', 10))

  const { data: job, error } = await admin
    .from('csv_jobs')
    .select('id, original_filename, row_count, status, column_mapping, parsed_data, created_at')
    .eq('id', id)
    .single()

  if (error || !job) return NextResponse.json({ error: 'CSV job not found' }, { status: 404 })

  // Paginate rows from parsed_data
  const allRows: Record<string, string>[] = Array.isArray(job.parsed_data) ? job.parsed_data : []
  const totalRows = allRows.length
  const offset = (page - 1) * limit
  const pageRows = allRows.slice(offset, offset + limit)

  // Derive headers from first row (exclude internal _-prefixed keys)
  const allHeaders = totalRows > 0 ? Object.keys(allRows[0]) : []
  const headers = allHeaders.filter((h) => !h.startsWith('_'))

  return NextResponse.json({
    id: job.id,
    filename: job.original_filename,
    row_count: job.row_count ?? totalRows,
    status: job.status,
    column_mapping: job.column_mapping ?? {},
    headers,
    rows: pageRows.map((row) => headers.map((h) => String(row[h] ?? ''))),
    pagination: {
      page,
      limit,
      total: totalRows,
      pages: Math.ceil(totalRows / limit),
    },
  })
}

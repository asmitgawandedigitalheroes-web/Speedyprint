/**
 * Production File Generator — Feature 4.6
 *
 * Generates print-ready output files for an entire order:
 *   • Single-design items   → one PDF per item (+ per panel for multi-panel templates)
 *   • CSV variable-data items → one PDF per data row with {{placeholder}} merge
 *   • PNG secondary format  → generated alongside PDF when requested
 *
 * Storage layout (bucket: "production"):
 *   {order_id}/order_manifest.json
 *   {order_id}/{item_id}_{ProductName}/ORD-0042_RaceBib_001_JohnSmith.pdf
 *   {order_id}/csv_data/original_upload.csv
 *
 * NOTE: PNG generation requires `sharp` or `@napi-rs/canvas` to be installed.
 * When neither is available the system gracefully records a "png_pending" flag
 * in the production_file metadata so downstream tooling can rasterise later.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generatePDF, mergeVariables } from '@/lib/pdf/generator'
import type { PrintSpecs } from '@/lib/pdf/generator'
import { generatePNG } from '@/lib/pdf/generatePNG'
import { convertToCmyk } from '@/lib/pdf/cmyk'
import type { ProductTemplate } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const BUCKET = 'production'

/** Strips characters that are unsafe in filenames/storage paths */
function safe(s: string, maxLen = 50): string {
  return String(s ?? '')
    .replace(/[^a-zA-Z0-9_\-. ]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, maxLen)
}

/** Zero-pads a number: pad(7, 3) → "007" */
function pad(n: number, w = 3): string {
  return String(n).padStart(w, '0')
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface GeneratedFile {
  order_item_id: string
  proof_id: string | null
  file_url: string
  file_name: string
  /** 'pdf' | 'png' */
  file_type: string
  storage_path: string
  resolution_dpi: number
  has_bleed: boolean
  metadata: Record<string, unknown>
}

export interface ProductionResult {
  order_id: string
  order_number: string
  manifest: Record<string, unknown>
  files: GeneratedFile[]
  errors: string[]
  skipped_items: string[]
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Generates all production files for an order, uploads them to Supabase Storage,
 * inserts records into `production_files`, updates order_item statuses, and
 * uploads an `order_manifest.json`.
 *
 * Idempotent: if files already exist for an item they are overwritten (upsert).
 */
export async function generateOrderProductionFiles(
  orderId: string,
  options: { 
    formats?: ('pdf' | 'png')[]; 
    force?: boolean; 
    cmyk?: boolean;
    sampleLimit?: number;
  } = {}
): Promise<ProductionResult> {
  const { formats = ['pdf'], cmyk = false, sampleLimit } = options
  const admin = createAdminClient()
  const errors: string[] = []
  const skipped: string[] = []
  const allFiles: GeneratedFile[] = []

  // ── Load order ─────────────────────────────────────────────────────────────
  const { data: order } = await admin
    .from('orders')
    .select(
      '*, profile:profiles!orders_user_id_fkey(full_name, email, company_name, phone)'
    )
    .eq('id', orderId)
    .single()

  if (!order) throw new Error(`Order ${orderId} not found`)

  const orderNum = order.order_number ?? orderId.slice(0, 8)

  // ── Load order items ───────────────────────────────────────────────────────
  const { data: items, error: itemsErr } = await admin
    .from('order_items')
    .select(
      `id, quantity, unit_price, line_total, status, selected_params,
       design_id, csv_job_id,
       product_group:product_groups(id, name),
       product_template:product_templates(id, name, print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, panels),
       design:designs(id, canvas_json),
       csv_job:csv_jobs!csv_job_id(id, original_filename, file_url, parsed_data, column_mapping, row_count),
       proofs(id, status, version)`
    )
    .eq('order_id', orderId)

  if (itemsErr) throw new Error(itemsErr.message)
  if (!items || items.length === 0) throw new Error('No items found for order')

  // ── Process each item ──────────────────────────────────────────────────────
  for (const item of items) {
    const tpl = item.product_template as unknown as ProductTemplate | null
    const productName = safe((item.product_group as any)?.name ?? 'Product', 30)
    const itemFolder = `${item.id}_${productName}`
    const basePath = `${orderId}/${itemFolder}`

    const printSpecs: PrintSpecs = {
      print_width_mm: tpl?.print_width_mm ?? 100,
      print_height_mm: tpl?.print_height_mm ?? 70,
      bleed_mm: tpl?.bleed_mm ?? 3,
    }
    const dpi = tpl?.dpi ?? 300

    /** Applies CMYK conversion when enabled; returns original bytes on failure. */
    async function maybeCmyk(bytes: Uint8Array): Promise<Uint8Array> {
      if (!cmyk) return bytes
      const { bytes: out } = await convertToCmyk(bytes)
      return out
    }

    // Find most-recent approved proof (for linking proof_id to production file)
    const approvedProof = (item.proofs as any[] | null)
      ?.sort((a, b) => b.version - a.version)
      ?.find((p: any) => p.status === 'approved') ?? null
    const proofId: string | null = approvedProof?.id ?? null

    // ── CSV variable-data batch ──────────────────────────────────────────────
    if (item.csv_job_id && item.csv_job) {
      const csvJob = item.csv_job as any
      const rows = (csvJob.parsed_data ?? []) as Record<string, string>[]
      const colMap = (csvJob.column_mapping ?? {}) as Record<string, string>
      const baseCanvas = (item.design as any)?.canvas_json

      if (!baseCanvas) {
        errors.push(`Item ${item.id}: CSV job has no base design canvas`)
        skipped.push(item.id)
        continue
      }

      // Limit rows if sampling
      const limit = sampleLimit ?? rows.length
      const rowsToProcess = rows.slice(0, Math.min(limit, rows.length))

      for (let rowIdx = 0; rowIdx < rowsToProcess.length; rowIdx++) {
        const row = rowsToProcess[rowIdx]

        // Build variable substitution map from column mapping
        const variables: Record<string, string> = {}
        for (const [placeholder, colName] of Object.entries(colMap)) {
          variables[placeholder] = String(row[colName] ?? '')
        }

        // Primary field value (first variable) used in filename for human readability
        const primaryVal = safe(Object.values(variables)[0] ?? `Row${rowIdx + 1}`, 30)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const fileName = `${safe(orderNum)}_${productName}_${pad(rowIdx + 1)}_${primaryVal}_${dateStr}.pdf`
        const storagePath = `${basePath}/${fileName}`

        try {
          const mergedCanvas = mergeVariables(baseCanvas, variables)
          const rawPdfBytes = await generatePDF(mergedCanvas, printSpecs, {
            isProof: false,
            includeBleed: true,
          })
          const pdfBytes = await maybeCmyk(rawPdfBytes)

          const { error: uploadErr } = await admin.storage
            .from(BUCKET)
            .upload(storagePath, pdfBytes, {
              contentType: 'application/pdf',
              upsert: true,
            })

          if (uploadErr) {
            errors.push(`Item ${item.id} row ${rowIdx + 1}: ${uploadErr.message}`)
            continue
          }

          const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

          allFiles.push({
            order_item_id: item.id,
            proof_id: proofId,
            file_url: publicUrl,
            file_name: fileName,
            file_type: 'pdf',
            storage_path: storagePath,
            resolution_dpi: dpi,
            has_bleed: true,
            metadata: {
              row_index: rowIdx,
              csv_job_id: item.csv_job_id,
              variables,
              template: tpl?.name,
              order_number: orderNum,
              panel: 'single',
            },
          })

          // PNG secondary format (real rasterisation via @napi-rs/canvas)
          if (formats.includes('png')) {
            const pngName = fileName.replace(/\.pdf$/, '.png')
            const pngPath = storagePath.replace(/\.pdf$/, '.png')
            try {
              const mergedCanvas2 = mergeVariables(baseCanvas, variables)
              const pngBytes = await generatePNG(mergedCanvas2, printSpecs, {
                isProof: false,
                includeBleed: true,
                dpi,
              })
              const { error: pngUploadErr } = await admin.storage
                .from(BUCKET)
                .upload(pngPath, pngBytes, { contentType: 'image/png', upsert: true })
              const pngUrl = pngUploadErr
                ? publicUrl
                : admin.storage.from(BUCKET).getPublicUrl(pngPath).data.publicUrl
              allFiles.push({
                order_item_id: item.id,
                proof_id: proofId,
                file_url: pngUrl,
                file_name: pngName,
                file_type: 'png',
                storage_path: pngPath,
                resolution_dpi: dpi,
                has_bleed: true,
                metadata: {
                  row_index: rowIdx,
                  csv_job_id: item.csv_job_id,
                  variables,
                  template: tpl?.name,
                  order_number: orderNum,
                  panel: 'single',
                },
              })
            } catch (pngErr) {
              console.error('[ProdGen] PNG generation error (CSV row):', pngErr)
            }
          }
        } catch (err) {
          errors.push(`Item ${item.id} row ${rowIdx + 1}: ${String(err)}`)
        }
      }

      // Also copy original CSV file to csv_data folder (done later in manifest upload)

    // ── Single design ────────────────────────────────────────────────────────
    } else if (item.design_id && item.design) {
      const canvasJSON = (item.design as any).canvas_json
      if (!canvasJSON) {
        errors.push(`Item ${item.id}: Design has no canvas JSON`)
        skipped.push(item.id)
        continue
      }

      const panels = tpl?.panels as unknown as { name: string; canvas_json?: unknown }[] | undefined
      const panelList = panels && panels.length > 1 ? panels : null

      if (panelList) {
        // ── Multi-panel: one file per panel ───────────────────────────────
        for (let pi = 0; pi < panelList.length; pi++) {
          const panel = panelList[pi]
          const panelCanvas = panel.canvas_json ?? canvasJSON
          const panelName = safe(panel.name ?? `Panel${pi + 1}`, 20)
          const fileName = `${safe(orderNum)}_${productName}_Panel_${panelName}.pdf`
          const storagePath = `${basePath}/${fileName}`

          try {
            const rawPdfBytes = await generatePDF(panelCanvas as any, printSpecs, {
              isProof: false,
              includeBleed: true,
            })
            const pdfBytes = await maybeCmyk(rawPdfBytes)

            const { error: uploadErr } = await admin.storage
              .from(BUCKET)
              .upload(storagePath, pdfBytes, {
                contentType: 'application/pdf',
                upsert: true,
              })

            if (uploadErr) {
              errors.push(`Item ${item.id} panel "${panel.name}": ${uploadErr.message}`)
              continue
            }

            const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

            allFiles.push({
              order_item_id: item.id,
              proof_id: proofId,
              file_url: publicUrl,
              file_name: fileName,
              file_type: 'pdf',
              storage_path: storagePath,
              resolution_dpi: dpi,
              has_bleed: true,
              metadata: {
                panel: panel.name,
                panel_index: pi,
                template: tpl?.name,
                design_id: item.design_id,
                order_number: orderNum,
              },
            })

            if (formats.includes('png')) {
              const pngPanelName = fileName.replace(/\.pdf$/, '.png')
              const pngPanelPath = storagePath.replace(/\.pdf$/, '.png')
              try {
                const pngBytes = await generatePNG(panelCanvas as any, printSpecs, {
                  isProof: false,
                  includeBleed: true,
                  dpi,
                })
                const { error: pngUploadErr } = await admin.storage
                  .from(BUCKET)
                  .upload(pngPanelPath, pngBytes, { contentType: 'image/png', upsert: true })
                const pngUrl = pngUploadErr
                  ? publicUrl
                  : admin.storage.from(BUCKET).getPublicUrl(pngPanelPath).data.publicUrl
                allFiles.push({
                  order_item_id: item.id,
                  proof_id: proofId,
                  file_url: pngUrl,
                  file_name: pngPanelName,
                  file_type: 'png',
                  storage_path: pngPanelPath,
                  resolution_dpi: dpi,
                  has_bleed: true,
                  metadata: { panel: panel.name, panel_index: pi, template: tpl?.name, order_number: orderNum },
                })
              } catch (pngErr) {
                console.error('[ProdGen] PNG generation error (panel):', pngErr)
              }
            }
          } catch (err) {
            errors.push(`Item ${item.id} panel "${panel.name}": ${String(err)}`)
          }
        }

      } else {
        // ── Single panel ───────────────────────────────────────────────────
        const customerName = safe((order.profile as any)?.full_name ?? 'Customer', 30)
        const fileName = `${safe(orderNum)}_${productName}_Final_${customerName}.pdf`
        const storagePath = `${basePath}/${fileName}`

        try {
          const rawPdfBytes = await generatePDF(canvasJSON, printSpecs, {
            isProof: false,
            includeBleed: true,
          })
          const pdfBytes = await maybeCmyk(rawPdfBytes)

          const { error: uploadErr } = await admin.storage
            .from(BUCKET)
            .upload(storagePath, pdfBytes, {
              contentType: 'application/pdf',
              upsert: true,
            })

          if (uploadErr) {
            errors.push(`Item ${item.id}: ${uploadErr.message}`)
            skipped.push(item.id)
            continue
          }

          const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

          allFiles.push({
            order_item_id: item.id,
            proof_id: proofId,
            file_url: publicUrl,
            file_name: fileName,
            file_type: 'pdf',
            storage_path: storagePath,
            resolution_dpi: dpi,
            has_bleed: true,
            metadata: {
              template: tpl?.name,
              design_id: item.design_id,
              customer: customerName,
              order_number: orderNum,
              panel: 'single',
            },
          })

          if (formats.includes('png')) {
            const pngSingleName = fileName.replace(/\.pdf$/, '.png')
            const pngSinglePath = storagePath.replace(/\.pdf$/, '.png')
            try {
              const pngBytes = await generatePNG(canvasJSON, printSpecs, {
                isProof: false,
                includeBleed: true,
                dpi,
              })
              const { error: pngUploadErr } = await admin.storage
                .from(BUCKET)
                .upload(pngSinglePath, pngBytes, { contentType: 'image/png', upsert: true })
              const pngUrl = pngUploadErr
                ? publicUrl
                : admin.storage.from(BUCKET).getPublicUrl(pngSinglePath).data.publicUrl
              allFiles.push({
                order_item_id: item.id,
                proof_id: proofId,
                file_url: pngUrl,
                file_name: pngSingleName,
                file_type: 'png',
                storage_path: pngSinglePath,
                resolution_dpi: dpi,
                has_bleed: true,
                metadata: {
                  template: tpl?.name,
                  design_id: item.design_id,
                  customer: customerName,
                  order_number: orderNum,
                  panel: 'single',
                },
              })
            } catch (pngErr) {
              console.error('[ProdGen] PNG generation error (single):', pngErr)
            }
          }
        } catch (err) {
          errors.push(`Item ${item.id}: ${String(err)}`)
          skipped.push(item.id)
        }
      }

    } else {
      skipped.push(item.id)
      errors.push(`Item ${item.id}: No design or CSV job — skipped`)
    }
  }

  // ── Insert production_files records ───────────────────────────────────────
  if (allFiles.length > 0) {
    const inserts = allFiles.map((f) => ({
      order_item_id: f.order_item_id,
      proof_id: f.proof_id,
      file_url: f.file_url,
      file_name: f.file_name,
      file_type: f.file_type,
      resolution_dpi: f.resolution_dpi,
      has_bleed: f.has_bleed,
      metadata: f.metadata,
    }))

    // Delete existing records for these items first to prevent duplicates on re-runs
    // (the DB table lacks a unique constraint, so upsert would always insert)
    const generatedItemIds = [...new Set(allFiles.map((f) => f.order_item_id))]
    await admin
      .from('production_files')
      .delete()
      .in('order_item_id', generatedItemIds)

    await admin.from('production_files').insert(inserts)

    // Move successfully-generated items to in_production
    const successItemIds = [
      ...new Set(
        allFiles
          .filter((f) => f.file_type === 'pdf' && !f.metadata.png_pending)
          .map((f) => f.order_item_id)
      ),
    ]
    if (successItemIds.length > 0) {
      await admin
        .from('order_items')
        .update({ status: 'in_production' })
        .in('id', successItemIds)
    }
  }

  // ── Build & upload order manifest ──────────────────────────────────────────
  const manifest = buildManifest(order, orderNum, items, allFiles, errors)

  await admin.storage
    .from(BUCKET)
    .upload(`${orderId}/order_manifest.json`, JSON.stringify(manifest, null, 2), {
      contentType: 'application/json',
      upsert: true,
    })

  // ── Copy original CSV files to csv_data folder ────────────────────────────
  const csvItems = items.filter((i) => i.csv_job && (i.csv_job as any).file_url)
  for (const item of csvItems) {
    const csvJob = item.csv_job as any
    try {
      const res = await fetch(csvJob.file_url)
      if (!res.ok) continue
      const buf = await res.arrayBuffer()
      const fname = csvJob.original_filename || 'data.csv'
      await admin.storage
        .from(BUCKET)
        .upload(`${orderId}/csv_data/${fname}`, buf, {
          contentType: 'text/csv',
          upsert: true,
        })
    } catch {
      // Non-fatal
    }
  }

  return {
    order_id: orderId,
    order_number: orderNum,
    manifest,
    files: allFiles,
    errors,
    skipped_items: skipped,
  }
}

// ── Manifest builder (also used by zipper) ────────────────────────────────────

export function buildManifest(
  order: Record<string, unknown>,
  orderNum: string,
  items: any[],
  files: GeneratedFile[],
  errors: string[]
): Record<string, unknown> {
  const profile = (order.profile as any) ?? {}
  return {
    schema_version: '1.0',
    order_number: orderNum,
    order_id: order.id,
    status: order.status,
    customer: {
      name: profile.full_name ?? null,
      email: profile.email ?? null,
      company: profile.company_name ?? null,
      phone: profile.phone ?? null,
    },
    shipping_address: (order as any).shipping_address ?? null,
    billing_address: (order as any).billing_address ?? null,
    totals: {
      subtotal: (order as any).subtotal,
      tax: (order as any).tax,
      shipping: (order as any).shipping_cost,
      total: (order as any).total,
    },
    items: items.map((item) => ({
      id: item.id,
      product: (item.product_group as any)?.name ?? null,
      template: (item.product_template as any)?.name ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
      params: item.selected_params ?? {},
      status: item.status,
      design_id: item.design_id ?? null,
      csv_job_id: item.csv_job_id ?? null,
      csv_row_count: item.csv_job ? (item.csv_job as any).row_count : null,
      production_files: files
        .filter((f) => f.order_item_id === item.id && f.file_type === 'pdf')
        .map((f) => ({
          file_name: f.file_name,
          file_type: f.file_type,
          file_url: f.file_url,
          resolution_dpi: f.resolution_dpi,
          has_bleed: f.has_bleed,
        })),
    })),
    production_summary: {
      total_pdf_files: files.filter((f) => f.file_type === 'pdf').length,
      total_png_files: files.filter((f) => f.file_type === 'png').length,
      errors_count: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      generated_at: new Date().toISOString(),
    },
  }
}

// ── Get existing production status for an order ───────────────────────────────

export async function getOrderProductionStatus(orderId: string): Promise<{
  has_manifest: boolean
  file_count: number
  files: unknown[]
  manifest_url: string | null
}> {
  const admin = createAdminClient()

  const { data: orderItems } = await admin
    .from('order_items')
    .select('id')
    .eq('order_id', orderId)

  const itemIds = (orderItems ?? []).map((i) => i.id)

  if (itemIds.length === 0) {
    return { has_manifest: false, file_count: 0, files: [], manifest_url: null }
  }

  const { data: files } = await admin
    .from('production_files')
    .select('*')
    .in('order_item_id', itemIds)
    .order('generated_at', { ascending: false })

  // Check if manifest exists in storage
  const { data: manifestExists } = await admin.storage
    .from(BUCKET)
    .list(orderId, { search: 'order_manifest.json' })

  const hasManifest = !!(manifestExists && manifestExists.length > 0)
  const manifestUrl = hasManifest
    ? admin.storage.from(BUCKET).getPublicUrl(`${orderId}/order_manifest.json`).data.publicUrl
    : null

  return {
    has_manifest: hasManifest,
    file_count: files?.length ?? 0,
    files: files ?? [],
    manifest_url: manifestUrl,
  }
}

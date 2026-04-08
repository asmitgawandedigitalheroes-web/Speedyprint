/**
 * Production ZIP builder — Feature 4.6
 *
 * Assembles a hierarchical ZIP archive for one or many orders:
 *
 *  Single-order ZIP:
 *    order_manifest.json
 *    {item_id}_RaceBib/
 *      ORD-0042_RaceBib_001_JohnSmith.pdf
 *      ORD-0042_RaceBib_002_JaneDoe.pdf
 *    {item_id}_Label/
 *      ORD-0042_Label_Final_JohnSmith.pdf
 *    csv_data/
 *      original_upload.csv
 *
 *  Batch ZIP (multiple orders):
 *    ORD-0042/
 *      order_manifest.json
 *      {item_id}_RaceBib/...
 *    ORD-0043/
 *      ...
 */

import JSZip from 'jszip'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'production'

/**
 * Extracts the storage path from a public Supabase URL.
 * Example: https://.../public/production/folder/file.pdf -> folder/file.pdf
 */
function getStoragePath(url: string, bucket: string): string | null {
  try {
    const marker = `/public/${bucket}/`
    const index = url.indexOf(marker)
    if (index === -1) return null
    return url.slice(index + marker.length)
  } catch {
    return null
  }
}

// ── Single-order ZIP ──────────────────────────────────────────────────────────

export async function buildOrderZip(orderId: string): Promise<{
  zipBytes: Uint8Array
  fileName: string
  fileCount: number
}> {
  const admin = createAdminClient()
  const zip = new JSZip()

  // ── Load order & items ─────────────────────────────────────────────────────
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select(
      'order_number, status, shipping_address, billing_address, subtotal, tax, shipping_cost, total,' +
      'profile:profiles!orders_user_id_fkey(full_name, email, company_name)'
    )
    .eq('id', orderId)
    .single()
  
  console.log(`[Zipper] Building ZIP for order: ${orderId}`)

  if (orderError) {
    console.error(`[Zipper] Error fetching order ${orderId}:`, orderError)
    throw new Error(`Order fetch failed: ${orderError.message}`)
  }

  if (!order) throw new Error('Order not found')
  const o = order as any
  const orderNum = o.order_number ?? orderId.slice(0, 8)

  const { data: items, error: itemsError } = await admin
    .from('order_items')
    .select(
      'id, quantity, status, selected_params,' +
      'product_group:product_groups!order_items_product_group_id_fkey(name),' +
      'product_template:product_templates!order_items_product_template_id_fkey(name),' +
      'csv_job:csv_jobs!fk_csv_job(original_filename, file_url)'
    )
    .eq('order_id', orderId)
  
  console.log(`[Zipper] Found ${items?.length ?? 0} items for order ${orderId}`)

  if (itemsError) {
    console.error(`[Zipper] Error fetching items for ${orderId}:`, itemsError)
    throw new Error(`Items fetch failed: ${itemsError.message}`)
  }

  if (!items || items.length === 0) throw new Error('No items found')
  const itemIds = (items as any[]).map((i) => i.id)
  console.log(`[Zipper] Item IDs:`, itemIds)

  // ── Fetch production files ─────────────────────────────────────────────────
  const { data: productionFiles } = await admin
    .from('production_files')
    .select('order_item_id, file_name, file_url, file_type, resolution_dpi, has_bleed')
    .in('order_item_id', itemIds)
    .order('file_name')
  
  console.log(`[Zipper] Found ${productionFiles?.length ?? 0} production files in DB for these items.`)

  // ── 1. order_manifest.json ─────────────────────────────────────────────────
  // Try to pull pre-built manifest from storage first
  try {
    const { data: manifestBlob } = await admin.storage
      .from(BUCKET)
      .download(`${orderId}/order_manifest.json`)
    if (manifestBlob) {
      zip.file('order_manifest.json', await manifestBlob.arrayBuffer())
    } else {
      throw new Error('not found')
    }
  } catch {
    // Build an inline manifest if not yet generated
    const inlineManifest = {
      order_number: orderNum,
      order_id: orderId,
      status: o.status,
      customer: {
        name: o.profile?.full_name ?? null,
        email: o.profile?.email ?? null,
        company: o.profile?.company_name ?? null,
      },
      shipping_address: o.shipping_address ?? null,
      totals: {
        subtotal: o.subtotal,
        tax: o.tax,
        shipping: o.shipping_cost,
        total: o.total,
      },
      items: (items as any[]).map((i) => ({
        id: i.id,
        product: i.product_group?.name,
        template: i.product_template?.name,
        quantity: i.quantity,
        status: i.status,
      })),
      generated_at: new Date().toISOString(),
    }
    zip.file('order_manifest.json', JSON.stringify(inlineManifest, null, 2))
  }

  // ── 2. Per-item folders (grouped by order_item_id) ─────────────────────────
  let bundledCount = 0

  if (productionFiles && productionFiles.length > 0) {
    console.log(`[Zipper] Starting production file bundling...`)
    // Group files → { [itemId]: file[] }
    const byItem = (productionFiles as any[]).reduce<Record<string, any[]>>(
      (acc, f) => {
        ;(acc[f.order_item_id] ??= []).push(f)
        return acc
      },
      {}
    )

    for (const [itemId, files] of Object.entries(byItem)) {
      const item = (items as any[]).find((i) => i.id === itemId)
      const productName = item?.product_group?.name?.replace(/[^a-zA-Z0-9]/g, '') ?? 'Product'
      const folder = zip.folder(`${itemId}_${productName}`)!

      await Promise.all(
        files.map(async (file) => {
          try {
            const path = getStoragePath(file.file_url, BUCKET)
            if (!path) {
              console.warn(`[Zipper] Could not parse path from URL: ${file.file_url}`)
              return
            }
            console.log(`[Zipper] Downloading from storage: ${path}`)

            const { data, error } = await admin.storage
              .from(BUCKET)
              .download(path)
            
            if (error || !data) {
              console.warn(`[Zipper] Storage download failed for ${path}:`, error?.message || 'No data returned')
              return
            }
            
            console.log(`[Zipper] Added file to ZIP: ${file.file_name} (${data.size} bytes)`)

            folder.file(file.file_name, await data.arrayBuffer())
            bundledCount++
          } catch (err) {
            console.error(`[Zipper] Error bundled file ${file.file_name}:`, err)
            // Non-fatal — skip missing file
          }
        })
      )
    }
  }

  // ── 3. csv_data folder ─────────────────────────────────────────────────────
  // First try the already-uploaded copy in storage
  try {
    const { data: csvList } = await admin.storage
      .from(BUCKET)
      .list(`${orderId}/csv_data`)
    if (csvList && csvList.length > 0) {
      const csvFolder = zip.folder('csv_data')!
      await Promise.all(
        csvList.map(async (csvFile) => {
          const { data } = await admin.storage
            .from(BUCKET)
            .download(`${orderId}/csv_data/${csvFile.name}`)
          if (data) csvFolder.file(csvFile.name, await data.arrayBuffer())
        })
      )
    }
  } catch {
    // Fall back to original file_url from csv_jobs
    const csvItems = (items as any[]).filter((i) => i.csv_job?.file_url)
    if (csvItems.length > 0) {
      const csvFolder = zip.folder('csv_data')!
      await Promise.all(
        csvItems.map(async (item: any) => {
          const csvJob = item.csv_job
          try {
            const res = await fetch(csvJob.file_url)
            if (!res.ok) return
            csvFolder.file(csvJob.original_filename || 'data.csv', await res.arrayBuffer())
          } catch { }
        })
      )
    }
  }

  const safeOrderNum = orderNum.replace(/[^a-zA-Z0-9\-_]/g, '')
  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  
  console.log(`[Zipper] ZIP generation complete. Total production files: ${bundledCount}. Final ZIP size: ${zipBytes.length} bytes.`)

  return {
    zipBytes,
    fileName: `${safeOrderNum}_production.zip`,
    fileCount: bundledCount,
  }
}

// ── Batch ZIP (multiple orders) ───────────────────────────────────────────────

export interface BatchFilter {
  dateFrom?: string  // ISO date string, e.g. "2026-01-01"
  dateTo?: string
  status?: string    // order status, e.g. "in_production"
  product_type?: string  // product_group name filter
  limit?: number     // max orders (default 50)
}

export async function buildBatchZip(filter: BatchFilter = {}): Promise<{
  zipBytes: Uint8Array
  fileName: string
  orderCount: number
  fileCount: number
}> {
  const admin = createAdminClient()
  const limit = Math.min(filter.limit ?? 50, 100)

  // ── Query orders matching filter ───────────────────────────────────────────
  let query = admin
    .from('orders')
    .select('id, order_number, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filter.status) query = query.eq('status', filter.status)
  if (filter.dateFrom) query = query.gte('created_at', filter.dateFrom)
  if (filter.dateTo) query = query.lte('created_at', filter.dateTo + 'T23:59:59Z')

  const { data: orders } = await query
  if (!orders || orders.length === 0) throw new Error('No orders match the filter')

  const zip = new JSZip()
  let totalFiles = 0
  let includedOrders = 0

  for (const order of orders) {
    const orderNum = (order.order_number ?? order.id).replace(/[^a-zA-Z0-9\-_]/g, '')

    // Get item ids for this order
    const { data: itemRows, error: itemsError } = await admin
      .from('order_items')
      .select('id, product_group:product_groups!order_items_product_group_id_fkey(name)')
      .eq('order_id', order.id)

    if (itemsError) {
      console.warn(`[Zipper] Batch items fetch failed for ${order.id}:`, itemsError)
      continue
    }

    if (!itemRows || itemRows.length === 0) continue

    // Optional product-type filter
    if (filter.product_type) {
      const hasMatchingProduct = itemRows.some(
        (i) =>
          (i.product_group as any)?.name
            ?.toLowerCase()
            .includes(filter.product_type!.toLowerCase())
      )
      if (!hasMatchingProduct) continue
    }

    const itemIds = itemRows.map((i) => i.id)
    const { data: prodFiles } = await admin
      .from('production_files')
      .select('order_item_id, file_name, file_url')
      .in('order_item_id', itemIds)
      .eq('file_type', 'pdf')

    if (!prodFiles || prodFiles.length === 0) continue

    const orderFolder = zip.folder(orderNum)!

    // Add manifest if it exists
    try {
      const { data: manifestBlob } = await admin.storage
        .from(BUCKET)
        .download(`${order.id}/order_manifest.json`)
      if (manifestBlob)
        orderFolder.file('order_manifest.json', await manifestBlob.arrayBuffer())
    } catch { }

    // Group production files by item
    const byItem = prodFiles.reduce<Record<string, typeof prodFiles>>((acc, f) => {
      ;(acc[f.order_item_id] ??= []).push(f)
      return acc
    }, {})

    for (const [itemId, files] of Object.entries(byItem)) {
      const item = itemRows.find((i) => i.id === itemId)
      const productName = (item?.product_group as any)?.name?.replace(/[^a-zA-Z0-9]/g, '') ?? 'Product'
      const itemFolder = orderFolder.folder(`${itemId}_${productName}`)!

      await Promise.all(
        files.map(async (file) => {
          try {
            const path = getStoragePath(file.file_url, BUCKET)
            if (!path) return

            const { data, error } = await admin.storage
              .from(BUCKET)
              .download(path)
            
            if (error || !data) return

            itemFolder.file(file.file_name, await data.arrayBuffer())
            totalFiles++
          } catch (err) {
            console.error(`[Zipper] Batch error for ${file.file_name}:`, err)
          }
        })
      )
    }

    includedOrders++
  }

  if (includedOrders === 0) throw new Error('No production files found for matching orders')

  const dateStr = new Date().toISOString().split('T')[0]
  const statusTag = filter.status ? `_${filter.status}` : ''
  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return {
    zipBytes,
    fileName: `batch_production${statusTag}_${dateStr}.zip`,
    orderCount: includedOrders,
    fileCount: totalFiles,
  }
}

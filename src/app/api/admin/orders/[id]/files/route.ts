import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Get order items for this order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', id)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ files: [] })
    }

    const itemIds = orderItems.map((item) => item.id)

    // Get production files for all order items
    const { data: productionFiles, error: filesError } = await supabase
      .from('production_files')
      .select('*')
      .in('order_item_id', itemIds)
      .order('generated_at', { ascending: false })

    if (filesError) {
      return NextResponse.json({ error: filesError.message }, { status: 500 })
    }

    // Also get uploaded files (artwork, proofs)
    const { data: uploadedFiles, error: uploadError } = await supabase
      .from('uploaded_files')
      .select('*')
      .in('order_item_id', itemIds)
      .order('created_at', { ascending: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    return NextResponse.json({
      productionFiles: productionFiles ?? [],
      uploadedFiles: uploadedFiles ?? [],
    })
  } catch (error) {
    console.error('Order files error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order files' },
      { status: 500 }
    )
  }
}

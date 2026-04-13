import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/csv-jobs
 *
 * Saves validated CSV data to the csv_jobs table so it can be
 * linked to an order at checkout.
 *
 * Body: { product_type: string; rows: Record<string, string>[] }
 * Returns: { id: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()
  const { product_type, rows } = body

  if (!product_type || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'product_type and rows are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('csv_jobs')
    .insert({
      product_type,
      parsed_data: rows,
      row_count: rows.length,
      status: 'validated',
      user_id: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('csv_jobs insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}

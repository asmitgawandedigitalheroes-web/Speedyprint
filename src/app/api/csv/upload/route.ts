import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { template_id, filename, parsed_data, column_mapping, row_count } = body

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('csv_jobs')
    .insert({
      user_id: user.id,
      original_filename: filename,
      parsed_data,
      column_mapping,
      row_count,
      status: 'validated',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

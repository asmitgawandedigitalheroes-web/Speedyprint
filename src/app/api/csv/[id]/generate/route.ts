import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Update status to processing
  await admin.from('csv_jobs').update({ status: 'processing', progress: 0 }).eq('id', id)

  // Get job data
  const { data: job } = await admin.from('csv_jobs').select('*').eq('id', id).single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Background processing simulation
  // In production, this would use an Edge Function or background job
  const totalRows = job.row_count || 0
  const errors: unknown[] = []

  // Process in batches (simulated for now - real implementation would use pdf-lib)
  for (let i = 0; i < totalRows; i++) {
    const progress = Math.round(((i + 1) / totalRows) * 100)

    // Update progress every 10 rows or on last row
    if (i % 10 === 0 || i === totalRows - 1) {
      await admin.from('csv_jobs').update({ progress }).eq('id', id)
    }
  }

  // Mark complete
  await admin
    .from('csv_jobs')
    .update({
      status: errors.length > 0 ? 'error' : 'completed',
      progress: 100,
      error_log: errors,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.json({ status: 'processing', job_id: id })
}

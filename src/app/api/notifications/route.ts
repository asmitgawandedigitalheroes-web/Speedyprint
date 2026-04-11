import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    
    // Check if admin or staff
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'production_staff'

    // Fetch relevant audit logs
    let query = admin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (isAdmin) {
      // Admins see everything, but prioritize admin actions or order actions
      // No filter needed, or maybe exclude very minor things if we had them
    } else {
      // Customers see their own actions + admin actions on their orders
      query = query.or(`user_id.eq.${user.id},metadata->>order_user_id.eq.${user.id}`)
    }

    const { data: logs, error } = await query

    if (error) throw error

    // Format logs into notifications
    const notifications = (logs || []).map(log => {
      let title = 'System Activity'
      let message = ''
      const orderNum = log.metadata?.order_number ? `#${log.metadata.order_number}` : ''

      switch (log.action) {
        case 'order_placed':
          title = 'Order Placed'
          message = `New order ${orderNum} has been received.`
          break
        case 'order_status_updated':
          title = 'Order Update'
          message = `Order ${orderNum} status changed to ${log.metadata?.status?.replace(/_/g, ' ')}.`
          break
        case 'proof_created':
          title = 'New Proof Ready'
          message = `A new proof is ready for review on order ${orderNum}.`
          break
        case 'proof_approved':
          title = 'Proof Approved'
          message = `Proof for order ${orderNum} was approved.`
          break
        case 'proof_revision_requested':
          title = 'Revision Requested'
          message = `A revision was requested for order ${orderNum}.`
          break
        case 'site_settings_updated':
          title = 'Settings Updated'
          message = `Global site settings were updated by an administrator.`
          break
        case 'design_created':
          title = 'Design Saved'
          message = log.metadata?.name ? `Design "${log.metadata.name}" has been saved.` : 'A new design was saved.'
          break
        default:
          title = log.action.replace(/_/g, ' ').toUpperCase()
          message = `Activity tracked for ${log.entity_type}${orderNum ? ' on order ' + orderNum : ''}`
      }

      return {
        id: log.id,
        created_at: log.created_at,
        type: log.entity_type,
        action: log.action,
        order_id: log.entity_type === 'order' ? log.entity_id : log.metadata?.order_id,
        title,
        message,
        is_admin_action: log.is_admin_action
      }
    })

    return NextResponse.json({ notifications })
  } catch (err) {
    console.error('Failed to fetch notifications:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

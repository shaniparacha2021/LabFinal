import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/admin/notifications - Get notifications for admin
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No authentication token' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeRead = searchParams.get('includeRead') === 'true'
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')

    // Get notifications for this admin
    const { data: notifications, error } = await supabaseAdmin
      .from('direct_notifications')
      .select(`
        *,
        recipient:notification_recipients!inner(
          id, delivery_status, sent_at, delivered_at, read_at, 
          acknowledged_at, email_sent, dashboard_shown, is_archived
        )
      `)
      .eq('recipient.admin_id', decoded.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get notifications error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Filter notifications
    let filteredNotifications = notifications || []

    if (!includeRead) {
      filteredNotifications = filteredNotifications.filter(n => 
        !n.recipient.read_at && !n.recipient.is_archived
      )
    }

    if (!includeArchived) {
      filteredNotifications = filteredNotifications.filter(n => 
        !n.recipient.is_archived
      )
    }

    if (type) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.notification_type === type
      )
    }

    if (priority) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.priority === priority
      )
    }

    // Get unread count
    const unreadCount = filteredNotifications.filter(n => 
      !n.recipient.read_at && !n.recipient.is_archived
    ).length

    // Get urgent notifications
    const urgentNotifications = filteredNotifications.filter(n => 
      n.is_urgent && !n.recipient.is_archived
    )

    // Get notifications requiring acknowledgment
    const acknowledgmentRequired = filteredNotifications.filter(n => 
      n.requires_acknowledgment && !n.recipient.acknowledged_at && !n.recipient.is_archived
    )

    return NextResponse.json({
      success: true,
      notifications: filteredNotifications,
      stats: {
        total: filteredNotifications.length,
        unread: unreadCount,
        urgent: urgentNotifications.length,
        acknowledgmentRequired: acknowledgmentRequired.length
      }
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

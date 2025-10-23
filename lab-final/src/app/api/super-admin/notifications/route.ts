import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/super-admin/notifications - List all direct notifications
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('super-admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No authentication token' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('direct_notifications')
      .select(`
        *,
        recipients:notification_recipients(
          id, admin_id, delivery_status, sent_at, delivered_at, read_at, 
          acknowledged_at, email_sent, dashboard_shown, is_archived
        )
      `, { count: 'exact' })

    // Apply filters
    if (type) {
      query = query.eq('notification_type', type)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Notifications fetch error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: stats } = await supabaseAdmin
      .from('direct_notifications')
      .select('notification_type, priority, is_urgent')
      .then(({ data }) => {
        const stats = {
          total: data?.length || 0,
          urgent: data?.filter(n => n.is_urgent).length || 0,
          byType: {
            alert: data?.filter(n => n.notification_type === 'ALERT').length || 0,
            feature_update: data?.filter(n => n.notification_type === 'FEATURE_UPDATE').length || 0,
            promotional_offer: data?.filter(n => n.notification_type === 'PROMOTIONAL_OFFER').length || 0,
            maintenance_notice: data?.filter(n => n.notification_type === 'MAINTENANCE_NOTICE').length || 0,
            account_warning: data?.filter(n => n.notification_type === 'ACCOUNT_WARNING').length || 0,
            payment_pending: data?.filter(n => n.notification_type === 'PAYMENT_PENDING').length || 0,
            system_alert: data?.filter(n => n.notification_type === 'SYSTEM_ALERT').length || 0,
            general_message: data?.filter(n => n.notification_type === 'GENERAL_MESSAGE').length || 0
          },
          byPriority: {
            high: data?.filter(n => n.priority === 'HIGH').length || 0,
            normal: data?.filter(n => n.priority === 'NORMAL').length || 0,
            low: data?.filter(n => n.priority === 'LOW').length || 0
          }
        }
        return { data: stats }
      })

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/super-admin/notifications - Send new direct notification
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('super-admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No authentication token' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const {
      title,
      message,
      notificationType,
      priority = 'NORMAL',
      recipientType = 'SPECIFIC',
      adminIds = [],
      actionUrl,
      actionButtonText,
      expiresAt,
      isUrgent = false,
      requiresAcknowledgment = false,
      metadata = {}
    } = await request.json()

    if (!title || !message || !notificationType) {
      return NextResponse.json(
        { message: 'Title, message, and notification type are required' },
        { status: 400 }
      )
    }

    if (recipientType === 'SPECIFIC' && (!adminIds || adminIds.length === 0)) {
      return NextResponse.json(
        { message: 'Admin IDs are required for specific recipients' },
        { status: 400 }
      )
    }

    // Send notification using database function
    const { data: notificationId, error } = await supabaseAdmin
      .rpc('send_direct_notification', {
        p_title: title,
        p_message: message,
        p_notification_type: notificationType,
        p_priority: priority,
        p_sender_id: decoded.userId,
        p_recipient_type: recipientType,
        p_admin_ids: adminIds,
        p_action_url: actionUrl,
        p_action_button_text: actionButtonText,
        p_expires_at: expiresAt,
        p_is_urgent: isUrgent,
        p_requires_acknowledgment: requiresAcknowledgment,
        p_metadata: metadata
      })

    if (error) {
      console.error('Send notification error:', error)
      return NextResponse.json(
        { message: 'Failed to send notification' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: decoded.userId,
        action: 'NOTIFICATION_SENT',
        details: {
          notification_id: notificationId,
          title,
          notification_type: notificationType,
          priority,
          recipient_type: recipientType,
          recipient_count: adminIds?.length || 0
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification sent successfully'
    })

  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

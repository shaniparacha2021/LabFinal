import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/super-admin/notifications/[id] - Get specific notification details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get notification with recipients
    const { data: notification, error } = await supabaseAdmin
      .from('direct_notifications')
      .select(`
        *,
        recipients:notification_recipients(
          id, admin_id, delivery_status, sent_at, delivered_at, read_at, 
          acknowledged_at, email_sent, email_sent_at, email_failed, 
          email_failure_reason, dashboard_shown, dashboard_shown_at, 
          is_archived, archived_at,
          admin:admins(full_name, email, username)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Get notification error:', error)
      return NextResponse.json(
        { message: 'Notification not found' },
        { status: 404 }
      )
    }

    // Get delivery statistics
    const { data: deliveryStats } = await supabaseAdmin
      .from('notification_recipients')
      .select('delivery_status')
      .eq('notification_id', params.id)

    const stats = {
      total: deliveryStats?.length || 0,
      pending: deliveryStats?.filter(r => r.delivery_status === 'PENDING').length || 0,
      sent: deliveryStats?.filter(r => r.delivery_status === 'SENT').length || 0,
      delivered: deliveryStats?.filter(r => r.delivery_status === 'DELIVERED').length || 0,
      read: deliveryStats?.filter(r => r.delivery_status === 'READ').length || 0,
      failed: deliveryStats?.filter(r => r.delivery_status === 'FAILED').length || 0,
      archived: deliveryStats?.filter(r => r.delivery_status === 'ARCHIVED').length || 0
    }

    return NextResponse.json({
      success: true,
      notification,
      stats
    })

  } catch (error) {
    console.error('Get notification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/super-admin/notifications/[id] - Update notification
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      priority,
      actionUrl,
      actionButtonText,
      expiresAt,
      isUrgent,
      requiresAcknowledgment,
      metadata
    } = await request.json()

    // Update notification
    const { error } = await supabaseAdmin
      .from('direct_notifications')
      .update({
        title,
        message,
        priority,
        action_url: actionUrl,
        action_button_text: actionButtonText,
        expires_at: expiresAt,
        is_urgent: isUrgent,
        requires_acknowledgment: requiresAcknowledgment,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      console.error('Update notification error:', error)
      return NextResponse.json(
        { message: 'Failed to update notification' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: decoded.userId,
        action: 'NOTIFICATION_UPDATED',
        details: {
          notification_id: params.id,
          changes: {
            title,
            message,
            priority,
            actionUrl,
            actionButtonText,
            expiresAt,
            isUrgent,
            requiresAcknowledgment
          }
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully'
    })

  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/super-admin/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete notification (cascade will delete recipients)
    const { error } = await supabaseAdmin
      .from('direct_notifications')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Delete notification error:', error)
      return NextResponse.json(
        { message: 'Failed to delete notification' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: decoded.userId,
        action: 'NOTIFICATION_DELETED',
        details: {
          notification_id: params.id
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    })

  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

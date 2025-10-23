import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/super-admin/admin-controls/[id]/suspend - Suspend admin account
export async function POST(
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

    const { suspensionReason, suspensionNotes } = await request.json()

    if (!suspensionReason) {
      return NextResponse.json(
        { message: 'Suspension reason is required' },
        { status: 400 }
      )
    }

    // Suspend admin account using database function
    const { data: success, error } = await supabaseAdmin
      .rpc('suspend_admin_account', {
        p_admin_id: params.id,
        p_suspension_reason: suspensionReason,
        p_suspension_notes: suspensionNotes,
        p_suspended_by: decoded.userId
      })

    if (error) {
      console.error('Suspend admin error:', error)
      return NextResponse.json(
        { message: 'Failed to suspend admin account' },
        { status: 500 }
      )
    }

    if (!success) {
      return NextResponse.json(
        { message: 'Admin account not found' },
        { status: 404 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: params.id,
        action: 'ACCOUNT_SUSPENDED',
        details: {
          suspension_reason: suspensionReason,
          suspension_notes: suspensionNotes,
          suspended_by: decoded.userId
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Send notification to admin about suspension
    await supabaseAdmin
      .rpc('send_direct_notification', {
        p_title: 'Account Suspended',
        p_message: `Your account has been suspended. Reason: ${suspensionReason}`,
        p_notification_type: 'ACCOUNT_WARNING',
        p_sender_id: decoded.userId,
        p_priority: 'HIGH',
        p_recipient_type: 'SPECIFIC',
        p_admin_ids: [params.id],
        p_action_url: '/admin/contact-support',
        p_action_button_text: 'Contact Support',
        p_is_urgent: true,
        p_requires_acknowledgment: true
      })

    return NextResponse.json({
      success: true,
      message: 'Admin account suspended successfully'
    })

  } catch (error) {
    console.error('Suspend admin error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

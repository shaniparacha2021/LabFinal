import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/super-admin/admin-controls/[id]/reactivate - Reactivate admin account
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

    // Reactivate admin account using database function
    const { data: success, error } = await supabaseAdmin
      .rpc('reactivate_admin_account', {
        p_admin_id: params.id,
        p_reactivated_by: decoded.userId
      })

    if (error) {
      console.error('Reactivate admin error:', error)
      return NextResponse.json(
        { message: 'Failed to reactivate admin account' },
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
        action: 'ACCOUNT_REACTIVATED',
        details: {
          reactivated_by: decoded.userId
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Send notification to admin about reactivation
    await supabaseAdmin
      .rpc('send_direct_notification', {
        p_title: 'Account Reactivated',
        p_message: 'Your account has been reactivated and you can now access the system.',
        p_notification_type: 'GENERAL_MESSAGE',
        p_sender_id: decoded.userId,
        p_priority: 'NORMAL',
        p_recipient_type: 'SPECIFIC',
        p_admin_ids: [params.id],
        p_action_url: '/admin/dashboard',
        p_action_button_text: 'Go to Dashboard',
        p_is_urgent: false,
        p_requires_acknowledgment: false
      })

    return NextResponse.json({
      success: true,
      message: 'Admin account reactivated successfully'
    })

  } catch (error) {
    console.error('Reactivate admin error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

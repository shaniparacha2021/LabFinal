import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// POST /api/super-admin/admin-controls/[id]/reset-password - Reset admin password
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

    const { newPassword } = await request.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password is required and must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Hash the new password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update admin password
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Reset password error:', updateError)
      return NextResponse.json(
        { message: 'Failed to reset password' },
        { status: 500 }
      )
    }

    // Update account control record
    await supabaseAdmin
      .rpc('request_admin_password_reset', {
        p_admin_id: params.id,
        p_requested_by: decoded.userId
      })

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: params.id,
        action: 'PASSWORD_RESET',
        details: {
          reset_by: decoded.userId,
          reset_at: new Date().toISOString()
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Send notification to admin about password reset
    await supabaseAdmin
      .rpc('send_direct_notification', {
        p_title: 'Password Reset',
        p_message: 'Your password has been reset by a Super Admin. Please log in with your new password.',
        p_notification_type: 'ACCOUNT_WARNING',
        p_sender_id: decoded.userId,
        p_priority: 'HIGH',
        p_recipient_type: 'SPECIFIC',
        p_admin_ids: [params.id],
        p_action_url: '/admin/login',
        p_action_button_text: 'Login Now',
        p_is_urgent: true,
        p_requires_acknowledgment: true
      })

    return NextResponse.json({
      success: true,
      message: 'Admin password reset successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sendPasswordChangeEmail } from '@/lib/email-service'

export async function PUT(request: NextRequest) {
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
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Get current user with password hash
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId)

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { message: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Invalidate all existing sessions (force logout from all devices)
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', decoded.userId)

    // Clear current session cookie
    cookieStore.set('super-admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

    // Send password change confirmation email
    try {
      await sendPasswordChangeEmail(user.email)
    } catch (emailError) {
      console.error('Error sending password change email:', emailError)
      // Don't fail the request if email fails
    }

    // Log password change activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: decoded.userId,
        email: user.email,
        action: 'PASSWORD_CHANGED',
        ip_address: 'unknown',
        user_agent: 'unknown',
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      message: 'Password updated successfully. Please log in again.',
      logout: true
    })

  } catch (error) {
    console.error('Password update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

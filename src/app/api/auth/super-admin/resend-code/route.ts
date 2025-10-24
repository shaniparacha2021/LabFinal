import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists and is Super Admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { 
          message: 'User not found or not authorized',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Clear old verification codes for this user
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('user_id', user.id)

    // Store new verification code
    const { error: codeError } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        user_id: user.id,
        email: email,
        code: verificationCode,
        expires_at: expiresAt.toISOString(),
        is_used: false
      })

    if (codeError) {
      console.error('Error storing verification code:', codeError)
      return NextResponse.json(
        { message: 'Failed to generate verification code' },
        { status: 500 }
      )
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode)
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the request if email fails, just log it
    }

    // Log resend attempt
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: user.id,
        email: email,
        action: 'VERIFICATION_CODE_RESENT',
        ip_address: 'unknown',
        user_agent: 'unknown',
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      message: 'Verification code sent to your email',
      email: email
    })

  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
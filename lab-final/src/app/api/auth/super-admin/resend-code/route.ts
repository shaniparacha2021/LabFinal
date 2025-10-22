import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check rate limiting - max 3 resends per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: recentResends } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', tenMinutesAgo)

    if (recentResends && recentResends.length >= 3) {
      return NextResponse.json(
        { 
          message: 'Too many resend attempts. Please wait 10 minutes before trying again.',
          code: 'RATE_LIMITED'
        },
        { status: 429 }
      )
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store new verification code
    const { error: codeError } = await supabase
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
      return NextResponse.json(
        { message: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    // Log resend attempt
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        email: email,
        action: 'CODE_RESEND',
        ip_address: 'unknown',
        user_agent: 'unknown',
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      message: 'New verification code sent to your email'
    })

  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

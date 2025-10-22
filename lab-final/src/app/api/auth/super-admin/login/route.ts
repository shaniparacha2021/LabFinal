import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
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
      // Log failed attempt
      await logFailedAttempt(null, email, 'INVALID_USER')
      
      return NextResponse.json(
        { 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Check if account is locked
    const { data: lockout } = await supabase
      .from('account_lockouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (lockout && new Date(lockout.lockout_until) > new Date()) {
      return NextResponse.json(
        { 
          message: 'Account is temporarily locked due to multiple failed attempts',
          code: 'ACCOUNT_LOCKED',
          lockoutUntil: lockout.lockout_until
        },
        { status: 423 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      // Log failed attempt
      await logFailedAttempt(user.id, email, 'INVALID_PASSWORD')
      
      return NextResponse.json(
        { 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store verification code
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
      // Don't fail the request if email fails, just log it
    }

    // Clear any existing lockouts
    await supabase
      .from('account_lockouts')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // Log successful login attempt
    await logActivity(user.id, email, 'LOGIN_SUCCESS')

    return NextResponse.json({
      message: 'Verification code sent to your email',
      email: email
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function logFailedAttempt(userId: string | null, email: string, reason: string) {
  try {
    // Get current failed attempts in last 15 minutes
    const { data: attempts } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .eq('success', false)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

    const recentAttempts = attempts?.length || 0

    // Log this attempt
    await supabase
      .from('login_attempts')
      .insert({
        user_id: userId,
        email: email,
        success: false,
        ip_address: 'unknown', // You'd get this from request headers
        user_agent: 'unknown'
      })

    // If 5 or more failed attempts, lock the account
    if (recentAttempts >= 4) { // 4 previous + this one = 5 total
      if (userId) {
        await supabase
          .from('account_lockouts')
          .insert({
            user_id: userId,
            lockout_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
            is_active: true,
            reason: 'Multiple failed login attempts'
          })
      }
    }
  } catch (error) {
    console.error('Error logging failed attempt:', error)
  }
}

async function logActivity(userId: string, email: string, action: string) {
  try {
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        email: email,
        action: action,
        ip_address: 'unknown',
        user_agent: 'unknown',
        timestamp: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

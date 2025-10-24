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
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Check if account is locked
    const { data: lockout, error: lockoutError } = await supabase
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

    // Verify password (in a real app, you'd store hashed passwords)
    // For now, we'll use a simple check - replace with actual password verification
    const isValidPassword = await bcrypt.compare(password, user.password_hash || '')
    
    // For demo purposes, accept 'admin123' as password
    const isDemoPassword = password === 'admin123'

    if (!isValidPassword && !isDemoPassword) {
      // Log failed attempt
      await logFailedAttempt(user.id, email)
      
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

async function logFailedAttempt(userId: string, email: string) {
  try {
    // Get current failed attempts
    const { data: attempts } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
      .order('created_at', { ascending: false })

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
      await supabase
        .from('account_lockouts')
        .insert({
          user_id: userId,
          lockout_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
          is_active: true,
          reason: 'Multiple failed login attempts'
        })
    }
  } catch (error) {
    console.error('Error logging failed attempt:', error)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Simple Super Admin Login (no 2FA)...')
    
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
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
      console.log('❌ User not found or not Super Admin')
      return NextResponse.json(
        { 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Check if account is locked
    const { data: lockout } = await supabaseAdmin
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
    let isValidPassword = false
    
    if (user.password_hash) {
      isValidPassword = await bcrypt.compare(password, user.password_hash)
    } else {
      // Fallback for demo purposes
      isValidPassword = password === 'admin123'
    }

    if (!isValidPassword) {
      console.log('❌ Password verification failed')
      return NextResponse.json(
        { 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Clear any existing lockouts
    await supabaseAdmin
      .from('account_lockouts')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    // Log successful login
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: user.id,
        email: email,
        action: 'LOGIN_SUCCESS_SIMPLE',
        ip_address: 'unknown',
        user_agent: 'unknown',
        timestamp: new Date().toISOString()
      })

    console.log('✅ Simple login successful')
    return response

  } catch (error) {
    console.error('❌ Simple login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

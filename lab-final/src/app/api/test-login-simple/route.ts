import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing simple login flow...')
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    console.log('📧 Email:', email)
    console.log('🔑 Password length:', password.length)

    // Step 1: Check if user exists
    console.log('👤 Step 1: Checking if user exists...')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      console.error('❌ User query error:', userError)
      return NextResponse.json({
        success: false,
        error: 'User query failed',
        details: userError.message
      }, { status: 500 })
    }

    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json({
        success: false,
        error: 'User not found',
        step: 'user_lookup'
      }, { status: 404 })
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      has_password_hash: !!user.password_hash
    })

    // Step 2: Check if user is Super Admin
    if (user.role !== 'SUPER_ADMIN') {
      console.log('❌ User is not Super Admin')
      return NextResponse.json({
        success: false,
        error: 'User is not Super Admin',
        step: 'role_check',
        user_role: user.role
      }, { status: 403 })
    }

    // Step 3: Check if user is active
    if (!user.is_active) {
      console.log('❌ User is not active')
      return NextResponse.json({
        success: false,
        error: 'User is not active',
        step: 'active_check'
      }, { status: 403 })
    }

    // Step 4: Test password verification
    console.log('🔐 Step 4: Testing password verification...')
    let isValidPassword = false
    
    if (user.password_hash) {
      try {
        isValidPassword = await bcrypt.compare(password, user.password_hash)
        console.log('✅ Bcrypt comparison result:', isValidPassword)
      } catch (err) {
        console.error('❌ Bcrypt error:', err)
        return NextResponse.json({
          success: false,
          error: 'Password verification failed',
          step: 'password_verification',
          details: err instanceof Error ? err.message : 'Unknown error'
        }, { status: 500 })
      }
    } else {
      // Fallback for demo purposes
      isValidPassword = password === 'admin123'
      console.log('✅ Fallback password check result:', isValidPassword)
    }

    if (!isValidPassword) {
      console.log('❌ Password verification failed')
      return NextResponse.json({
        success: false,
        error: 'Invalid password',
        step: 'password_verification'
      }, { status: 401 })
    }

    console.log('✅ Password verification successful')

    // Step 5: Check for account lockouts
    console.log('🔒 Step 5: Checking for account lockouts...')
    const { data: lockouts } = await supabaseAdmin
      .from('account_lockouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const activeLockouts = lockouts?.filter(lockout => 
      new Date(lockout.lockout_until) > new Date()
    ) || []

    if (activeLockouts.length > 0) {
      console.log('❌ Account is locked')
      return NextResponse.json({
        success: false,
        error: 'Account is locked',
        step: 'lockout_check',
        lockout_until: activeLockouts[0].lockout_until
      }, { status: 423 })
    }

    console.log('✅ No active lockouts')

    // All checks passed
    return NextResponse.json({
      success: true,
      message: 'Login test successful!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active
      },
      steps_completed: [
        'User lookup',
        'Role verification (SUPER_ADMIN)',
        'Active status check',
        'Password verification',
        'Lockout check'
      ],
      next_steps: [
        'Login should work with these credentials',
        'User will be redirected to verification page',
        '2FA verification code will be sent via email'
      ]
    })

  } catch (error) {
    console.error('❌ Simple login test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Simple Login Test Endpoint',
    description: 'Tests the login flow step by step without 2FA',
    usage: 'POST /api/test-login-simple',
    body: {
      email: 'string',
      password: 'string'
    },
    purpose: 'Debug login issues by testing each step individually'
  })
}

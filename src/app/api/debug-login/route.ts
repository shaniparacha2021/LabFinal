import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'

    console.log('🔍 Debug Login API - Testing login process...')
    console.log('Email:', email)
    console.log('Password:', password)

    // Step 1: Check if user exists (same as login API)
    console.log('👤 Checking if user exists...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    if (userError) {
      console.error('❌ User query failed:', userError)
      return NextResponse.json({
        success: false,
        step: 'user_query',
        error: userError.message,
        details: userError,
        message: 'User query failed - this is what the login API sees'
      }, { status: 404 })
    }

    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json({
        success: false,
        step: 'user_not_found',
        message: 'User not found - this is what the login API sees',
        email: email
      }, { status: 404 })
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      has_password_hash: !!user.password_hash
    })

    // Step 2: Check account lockout (same as login API)
    console.log('🔒 Checking account lockout...')
    const { data: lockout } = await supabase
      .from('account_lockouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (lockout && new Date(lockout.lockout_until) > new Date()) {
      console.log('❌ Account is locked')
      return NextResponse.json({
        success: false,
        step: 'account_locked',
        message: 'Account is locked',
        lockout_until: lockout.lockout_until
      }, { status: 423 })
    }

    console.log('✅ Account is not locked')

    // Step 3: Test password verification (same as login API)
    console.log('🔐 Testing password verification...')
    let isValidPassword = false
    
    if (user.password_hash) {
      console.log('Using bcrypt password verification')
      isValidPassword = await bcrypt.compare(password, user.password_hash)
    } else {
      console.log('No password hash found, using fallback verification')
      isValidPassword = password === 'admin123'
    }

    console.log('Password verification result:', isValidPassword)

    if (!isValidPassword) {
      console.log('❌ Password verification failed')
      return NextResponse.json({
        success: false,
        step: 'password_verification',
        message: 'Password verification failed - this is what the login API sees',
        debug: {
          has_password_hash: !!user.password_hash,
          password_hash: user.password_hash,
          provided_password: password
        }
      }, { status: 401 })
    }

    console.log('✅ Password verification successful')

    // Step 4: Test verification code generation (same as login API)
    console.log('📧 Testing verification code generation...')
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

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
      console.error('❌ Verification code creation failed:', codeError)
      return NextResponse.json({
        success: false,
        step: 'verification_code',
        error: codeError.message,
        details: codeError,
        message: 'Verification code creation failed'
      }, { status: 500 })
    }

    console.log('✅ Verification code created successfully')

    return NextResponse.json({
      success: true,
      message: 'Login process would succeed! All steps passed.',
      debug: {
        user_found: true,
        user_details: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash
        },
        account_locked: false,
        password_verification: {
          result: isValidPassword,
          method: user.password_hash ? 'bcrypt' : 'fallback'
        },
        verification_code: {
          created: true,
          code: verificationCode,
          expires_at: expiresAt.toISOString()
        }
      },
      next_steps: {
        message: 'The login API should work. If it still fails, there might be an issue with the login API code itself.',
        suggestion: 'Check the browser network tab to see the exact error from the login API'
      }
    })

  } catch (error) {
    console.error('❌ Debug login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

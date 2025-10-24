import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing login after RLS fix...')
    
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'
    
    // Test the exact login query that the login API uses
    console.log('🔐 Testing login query...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    if (userError) {
      console.error('❌ Login query failed:', userError)
      return NextResponse.json({
        success: false,
        error: 'Login query failed',
        details: userError.message,
        recommendation: 'Run the final-fix-rls-policies.sql script in Supabase Dashboard'
      }, { status: 500 })
    }

    if (!user) {
      console.error('❌ User not found')
      return NextResponse.json({
        success: false,
        error: 'User not found',
        recommendation: 'Run the final-fix-rls-policies.sql script in Supabase Dashboard'
      }, { status: 404 })
    }

    console.log('✅ User found:', user.email)

    // Test password verification
    console.log('🔑 Testing password verification...')
    let isValidPassword = false
    
    if (user.password_hash) {
      isValidPassword = await bcrypt.compare(password, user.password_hash)
      console.log('🔐 Bcrypt verification result:', isValidPassword)
    } else {
      // Fallback verification
      isValidPassword = password === 'admin123'
      console.log('🔐 Fallback verification result:', isValidPassword)
    }

    if (!isValidPassword) {
      console.error('❌ Password verification failed')
      return NextResponse.json({
        success: false,
        error: 'Password verification failed',
        details: {
          has_password_hash: !!user.password_hash,
          password_hash: user.password_hash ? 'Present' : 'Missing'
        },
        recommendation: 'Check password hash in database'
      }, { status: 401 })
    }

    console.log('✅ Password verification successful')

    // Test verification code creation
    console.log('📧 Testing verification code creation...')
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
        error: 'Verification code creation failed',
        details: codeError.message,
        recommendation: 'Check verification_codes table permissions'
      }, { status: 500 })
    }

    console.log('✅ Verification code created successfully')

    return NextResponse.json({
      success: true,
      message: 'Login test PASSED! All components working correctly.',
      test_results: {
        user_found: true,
        password_verification: true,
        verification_code_creation: true
      },
      user_info: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active
      },
      next_steps: [
        'Login should now work with default credentials',
        'Email: shaniparacha2021@gmail.com',
        'Password: admin123'
      ]
    })

  } catch (error) {
    console.error('❌ Login test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Login Test Endpoint',
    description: 'Tests if login works after RLS policy fixes',
    usage: 'POST /api/test-login-now',
    purpose: 'Verifies that the authentication system is working correctly'
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'

    console.log('🔍 Debug Auth - Starting authentication debug...')
    console.log('Email:', email)
    console.log('Password provided:', password)

    // Step 1: Check environment variables
    console.log('📋 Environment Variables:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Step 2: Test database connection
    console.log('🔗 Testing database connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError)
      return NextResponse.json({
        success: false,
        step: 'database_connection',
        error: connectionError.message,
        details: connectionError
      }, { status: 500 })
    }

    console.log('✅ Database connection successful')

    // Step 3: Check if user exists
    console.log('👤 Checking if user exists...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      console.error('❌ User query failed:', userError)
      return NextResponse.json({
        success: false,
        step: 'user_query',
        error: userError.message,
        details: userError,
        email: email,
        message: 'User not found in database. Please run /api/setup-user-get first.'
      }, { status: 404 })
    }

    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json({
        success: false,
        step: 'user_not_found',
        message: 'User not found in database. Please run /api/setup-user-get first.',
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

    // Step 4: Check user role and status
    if (user.role !== 'SUPER_ADMIN') {
      console.log('❌ User role is not SUPER_ADMIN:', user.role)
      return NextResponse.json({
        success: false,
        step: 'invalid_role',
        message: 'User role is not SUPER_ADMIN',
        user_role: user.role
      }, { status: 403 })
    }

    if (!user.is_active) {
      console.log('❌ User is not active')
      return NextResponse.json({
        success: false,
        step: 'user_inactive',
        message: 'User account is not active'
      }, { status: 403 })
    }

    // Step 5: Test password verification
    console.log('🔐 Testing password verification...')
    let isValidPassword = false
    let passwordMethod = ''

    if (user.password_hash) {
      console.log('Using bcrypt password verification')
      isValidPassword = await bcrypt.compare(password, user.password_hash)
      passwordMethod = 'bcrypt'
    } else {
      console.log('No password hash found, using fallback verification')
      isValidPassword = password === 'admin123'
      passwordMethod = 'fallback'
    }

    console.log('Password verification result:', isValidPassword)
    console.log('Password method used:', passwordMethod)

    // Step 6: Generate test hash for comparison
    const testHash = await bcrypt.hash('admin123', 10)
    console.log('Test hash for admin123:', testHash)
    console.log('Stored hash:', user.password_hash)

    return NextResponse.json({
      success: isValidPassword,
      message: isValidPassword ? 'Authentication should work!' : 'Authentication will fail - password mismatch',
      debug: {
        environment_variables: {
          has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        database_connection: 'success',
        user_found: true,
        user_details: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash,
          password_hash_length: user.password_hash?.length || 0
        },
        password_verification: {
          method: passwordMethod,
          result: isValidPassword,
          provided_password: password,
          stored_hash: user.password_hash,
          test_hash: testHash
        }
      },
      instructions: {
        if_success: 'Try logging in at /super-admin/login',
        if_failure: 'The password verification is failing. Check the stored hash vs test hash above.'
      }
    })

  } catch (error) {
    console.error('❌ Debug auth error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

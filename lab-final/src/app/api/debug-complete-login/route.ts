import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Complete login debugging...')
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    const results = {
      step1_environment_check: { success: false, error: null, data: null },
      step2_database_connection: { success: false, error: null, data: null },
      step3_user_lookup: { success: false, error: null, data: null },
      step4_password_verification: { success: false, error: null, data: null },
      step5_lockout_check: { success: false, error: null, data: null },
      step6_final_test: { success: false, error: null, data: null }
    }

    // Step 1: Environment check
    console.log('🔧 Step 1: Checking environment...')
    try {
      const envCheck = {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nextauth_secret: !!process.env.NEXTAUTH_SECRET
      }
      
      results.step1_environment_check.success = Object.values(envCheck).every(Boolean)
      results.step1_environment_check.data = envCheck
    } catch (err) {
      results.step1_environment_check.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 2: Database connection test
    console.log('🔌 Step 2: Testing database connection...')
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count(*)')
        .limit(1)

      if (error) {
        results.step2_database_connection.error = error.message
      } else {
        results.step2_database_connection.success = true
        results.step2_database_connection.data = { connected: true, count: data?.[0]?.count || 0 }
      }
    } catch (err) {
      results.step2_database_connection.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 3: User lookup
    console.log('👤 Step 3: Looking up user...')
    try {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (userError) {
        results.step3_user_lookup.error = userError.message
      } else if (!user) {
        results.step3_user_lookup.error = 'User not found'
      } else {
        results.step3_user_lookup.success = true
        results.step3_user_lookup.data = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash,
          password_hash_length: user.password_hash?.length || 0
        }
      }
    } catch (err) {
      results.step3_user_lookup.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 4: Password verification
    if (results.step3_user_lookup.success && results.step3_user_lookup.data) {
      console.log('🔐 Step 4: Testing password verification...')
      try {
        const user = results.step3_user_lookup.data
        
        let isValidPassword = false
        let verificationMethod = 'none'
        
        if (user.has_password_hash) {
          // Get the actual password hash from database
          const { data: userWithHash } = await supabaseAdmin
            .from('users')
            .select('password_hash')
            .eq('email', email)
            .single()
          
          if (userWithHash?.password_hash) {
            isValidPassword = await bcrypt.compare(password, userWithHash.password_hash)
            verificationMethod = 'bcrypt'
          }
        } else {
          // Fallback verification
          isValidPassword = password === 'admin123'
          verificationMethod = 'fallback'
        }
        
        results.step4_password_verification.success = isValidPassword
        results.step4_password_verification.data = {
          method: verificationMethod,
          result: isValidPassword,
          has_hash: user.has_password_hash
        }
      } catch (err) {
        results.step4_password_verification.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Step 5: Lockout check
    if (results.step3_user_lookup.success && results.step3_user_lookup.data) {
      console.log('🔒 Step 5: Checking for lockouts...')
      try {
        const { data: lockouts } = await supabaseAdmin
          .from('account_lockouts')
          .select('*')
          .eq('user_id', results.step3_user_lookup.data.id)
          .eq('is_active', true)

        const activeLockouts = lockouts?.filter(lockout => 
          new Date(lockout.lockout_until) > new Date()
        ) || []

        results.step5_lockout_check.success = activeLockouts.length === 0
        results.step5_lockout_check.data = {
          is_locked: activeLockouts.length > 0,
          active_lockouts: activeLockouts.length,
          lockouts: activeLockouts
        }
      } catch (err) {
        results.step5_lockout_check.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Step 6: Final login test
    if (results.step3_user_lookup.success && results.step4_password_verification.success && results.step5_lockout_check.success) {
      console.log('🎯 Step 6: Final login test...')
      try {
        const { data: loginUser, error: loginError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('role', 'SUPER_ADMIN')
          .eq('is_active', true)
          .single()

        if (loginError || !loginUser) {
          results.step6_final_test.error = loginError?.message || 'User not found in login query'
        } else {
          results.step6_final_test.success = true
          results.step6_final_test.data = {
            id: loginUser.id,
            email: loginUser.email,
            role: loginUser.role,
            is_active: loginUser.is_active
          }
        }
      } catch (err) {
        results.step6_final_test.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Overall analysis
    const criticalSteps = [
      results.step1_environment_check,
      results.step2_database_connection,
      results.step3_user_lookup,
      results.step4_password_verification,
      results.step5_lockout_check
    ]

    const allCriticalStepsPass = criticalSteps.every(step => step.success)
    const loginShouldWork = allCriticalStepsPass && results.step6_final_test.success

    // Determine the exact issue
    let issue = 'Unknown'
    let recommendation = 'Check all steps'

    if (!results.step1_environment_check.success) {
      issue = 'Environment variables not set correctly'
      recommendation = 'Check environment variables in Vercel dashboard'
    } else if (!results.step2_database_connection.success) {
      issue = 'Database connection failed'
      recommendation = 'Check Supabase connection and credentials'
    } else if (!results.step3_user_lookup.success) {
      issue = 'User not found in database'
      recommendation = 'Run the database setup script to create the user'
    } else if (!results.step4_password_verification.success) {
      issue = 'Password verification failed'
      recommendation = 'Update password hash in database with correct bcrypt hash'
    } else if (!results.step5_lockout_check.success) {
      issue = 'Account is locked'
      recommendation = 'Clear account lockouts in database'
    } else if (!results.step6_final_test.success) {
      issue = 'Login query failed'
      recommendation = 'Check user role and active status'
    } else {
      issue = 'All steps pass - login should work'
      recommendation = 'Login should work now - try the frontend'
    }

    return NextResponse.json({
      success: loginShouldWork,
      message: loginShouldWork ? 
        'Login flow should work! All critical steps passed.' : 
        `Login flow has issues. Issue: ${issue}`,
      results,
      analysis: {
        environment_ok: results.step1_environment_check.success,
        database_connected: results.step2_database_connection.success,
        user_exists: results.step3_user_lookup.success,
        password_verification_works: results.step4_password_verification.success,
        account_not_locked: results.step5_lockout_check.success,
        login_query_works: results.step6_final_test.success
      },
      diagnosis: {
        issue: issue,
        recommendation: recommendation
      },
      next_steps: loginShouldWork ? [
        '✅ All checks passed - login should work',
        '🚀 Try logging in with the frontend',
        '📧 Email: shaniparacha2021@gmail.com',
        '🔑 Password: admin123'
      ] : [
        recommendation,
        'Re-run this diagnostic after fixing the issue',
        'Check the specific step that failed for more details'
      ]
    })

  } catch (error) {
    console.error('❌ Complete login debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Complete Login Debug Endpoint',
    description: 'Comprehensive debugging of the entire login flow',
    usage: 'POST /api/debug-complete-login',
    body: {
      email: 'string',
      password: 'string'
    },
    purpose: 'Identifies the exact step where login fails and provides specific recommendations'
  })
}

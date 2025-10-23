import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Complete login debugging...')
    
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'
    
    const results = {
      step1_user_exists: { success: false, error: null, data: null },
      step2_login_query: { success: false, error: null, data: null },
      step3_password_verification: { success: false, error: null, data: null },
      step4_account_lockout: { success: false, error: null, data: null },
      step5_recent_attempts: { success: false, error: null, data: null },
      step6_verification_code: { success: false, error: null, data: null }
    }

    // Step 1: Check if user exists (admin client)
    console.log('👤 Step 1: Checking if user exists...')
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        results.step1_user_exists.error = error.message
      } else if (!user) {
        results.step1_user_exists.error = 'User not found'
      } else {
        results.step1_user_exists.success = true
        results.step1_user_exists.data = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash
        }
      }
    } catch (err) {
      results.step1_user_exists.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 2: Test exact login API query (admin client)
    console.log('🔐 Step 2: Testing login API query...')
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', 'SUPER_ADMIN')
        .eq('is_active', true)
        .single()

      if (error) {
        results.step2_login_query.error = error.message
      } else if (!user) {
        results.step2_login_query.error = 'User not found with login criteria'
      } else {
        results.step2_login_query.success = true
        results.step2_login_query.data = {
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash
        }
      }
    } catch (err) {
      results.step2_login_query.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 3: Test password verification
    if (results.step2_login_query.success && results.step2_login_query.data) {
      console.log('🔑 Step 3: Testing password verification...')
      try {
        const user = results.step2_login_query.data
        
        // Get the actual password hash
        const { data: userWithHash } = await supabaseAdmin
          .from('users')
          .select('password_hash')
          .eq('email', email)
          .single()
        
        let isValidPassword = false
        
        if (userWithHash?.password_hash) {
          isValidPassword = await bcrypt.compare(password, userWithHash.password_hash)
        } else {
          // Fallback verification
          isValidPassword = password === 'admin123'
        }
        
        results.step3_password_verification.success = isValidPassword
        results.step3_password_verification.data = {
          method: userWithHash?.password_hash ? 'bcrypt' : 'fallback',
          result: isValidPassword,
          has_hash: !!userWithHash?.password_hash
        }
      } catch (err) {
        results.step3_password_verification.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Step 4: Check account lockout
    if (results.step2_login_query.success && results.step2_login_query.data) {
      console.log('🔒 Step 4: Checking account lockout...')
      try {
        const { data: lockouts } = await supabaseAdmin
          .from('account_lockouts')
          .select('*')
          .eq('user_id', results.step2_login_query.data.id)
          .eq('is_active', true)

        const activeLockouts = lockouts?.filter(lockout => 
          new Date(lockout.lockout_until) > new Date()
        ) || []

        results.step4_account_lockout.success = activeLockouts.length === 0
        results.step4_account_lockout.data = {
          is_locked: activeLockouts.length > 0,
          active_lockouts: activeLockouts.length,
          lockouts: activeLockouts
        }
      } catch (err) {
        results.step4_account_lockout.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Step 5: Check recent failed attempts
    console.log('📊 Step 5: Checking recent failed attempts...')
    try {
      const { data: failedAttempts } = await supabaseAdmin
        .from('login_attempts')
        .select('*')
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

      results.step5_recent_attempts.success = true
      results.step5_recent_attempts.data = {
        count: failedAttempts?.length || 0,
        attempts: failedAttempts || []
      }
    } catch (err) {
      results.step5_recent_attempts.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 6: Test verification code creation
    if (results.step2_login_query.success && results.step3_password_verification.success && results.step4_account_lockout.success) {
      console.log('📧 Step 6: Testing verification code creation...')
      try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

        const { error: codeError } = await supabaseAdmin
          .from('verification_codes')
          .insert({
            user_id: results.step2_login_query.data.id,
            email: email,
            code: verificationCode,
            expires_at: expiresAt.toISOString(),
            is_used: false
          })

        if (codeError) {
          results.step6_verification_code.error = codeError.message
        } else {
          results.step6_verification_code.success = true
          results.step6_verification_code.data = {
            code: verificationCode,
            expires_at: expiresAt.toISOString()
          }
        }
      } catch (err) {
        results.step6_verification_code.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Overall analysis
    const criticalSteps = [
      results.step1_user_exists,
      results.step2_login_query,
      results.step3_password_verification,
      results.step4_account_lockout
    ]

    const allCriticalStepsPass = criticalSteps.every(step => step.success)
    const loginShouldWork = allCriticalStepsPass && results.step6_verification_code.success

    // Determine the exact issue
    let issue = 'Unknown'
    let recommendation = 'Check all steps'

    if (!results.step1_user_exists.success) {
      issue = 'User does not exist in database'
      recommendation = 'Run the database setup script'
    } else if (!results.step2_login_query.success) {
      issue = 'Login query fails - RLS or role issue'
      recommendation = 'Check user role and RLS policies'
    } else if (!results.step3_password_verification.success) {
      issue = 'Password verification fails'
      recommendation = 'Check password hash in database'
    } else if (!results.step4_account_lockout.success) {
      issue = 'Account is locked due to failed attempts'
      recommendation = 'Run POST /api/clear-lockout to unlock account'
    } else if (!results.step6_verification_code.success) {
      issue = 'Verification code creation fails'
      recommendation = 'Check verification_codes table permissions'
    } else {
      issue = 'All steps pass - login should work'
      recommendation = 'Try logging in - it should work now'
    }

    return NextResponse.json({
      success: loginShouldWork,
      message: loginShouldWork ? 
        'Login flow should work! All critical steps passed.' : 
        `Login flow has issues. Issue: ${issue}`,
      results,
      analysis: {
        user_exists: results.step1_user_exists.success,
        login_query_works: results.step2_login_query.success,
        password_verification_works: results.step3_password_verification.success,
        account_not_locked: results.step4_account_lockout.success,
        verification_code_creation_works: results.step6_verification_code.success
      },
      diagnosis: {
        issue: issue,
        recommendation: recommendation
      },
      next_steps: loginShouldWork ? [
        'Try logging in with default credentials',
        'Email: shaniparacha2021@gmail.com',
        'Password: admin123'
      ] : [
        recommendation,
        'Re-run this diagnostic after fixing the issue'
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
    usage: 'POST /api/debug-login-complete',
    purpose: 'Identifies the exact step where login fails and provides specific recommendations'
  })
}

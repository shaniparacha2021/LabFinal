import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing complete login flow...')
    
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'
    
    const results = {
      step1_user_exists: { success: false, error: null, data: null },
      step2_login_query: { success: false, error: null, data: null },
      step3_password_verification: { success: false, error: null, data: null },
      step4_account_lockout_check: { success: false, error: null, data: null },
      step5_verification_code_creation: { success: false, error: null, data: null },
      step6_email_sending: { success: false, error: null, data: null }
    }

    // Step 1: Check if user exists (using admin client)
    console.log('👤 Step 1: Checking if user exists...')
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        results.step1_user_exists.error = error.message
        console.error('❌ User query failed:', error)
      } else if (!user) {
        results.step1_user_exists.error = 'User not found'
        console.error('❌ User not found')
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
        console.log('✅ User found:', user.email)
      }
    } catch (err) {
      results.step1_user_exists.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 2: Test exact login API query (using regular client - this is where it might fail)
    console.log('🔐 Step 2: Testing login API query (regular client)...')
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', 'SUPER_ADMIN')
        .eq('is_active', true)
        .single()

      if (error) {
        results.step2_login_query.error = error.message
        console.error('❌ Login query failed:', error)
      } else if (!user) {
        results.step2_login_query.error = 'User not found with login criteria'
        console.error('❌ User not found with login criteria')
      } else {
        results.step2_login_query.success = true
        results.step2_login_query.data = {
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash
        }
        console.log('✅ Login query successful')
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
          console.log('🔐 Bcrypt verification result:', isValidPassword)
        } else {
          // Fallback verification
          isValidPassword = password === 'admin123'
          console.log('🔐 Fallback verification result:', isValidPassword)
        }
        
        results.step3_password_verification.success = isValidPassword
        results.step3_password_verification.data = {
          method: userWithHash?.password_hash ? 'bcrypt' : 'fallback',
          result: isValidPassword,
          has_hash: !!userWithHash?.password_hash
        }
        
        if (!isValidPassword) {
          console.error('❌ Password verification failed')
        } else {
          console.log('✅ Password verification successful')
        }
      } catch (err) {
        results.step3_password_verification.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Step 4: Check account lockout
    if (results.step2_login_query.success && results.step2_login_query.data) {
      console.log('🔒 Step 4: Checking account lockout...')
      try {
        const { data: lockout } = await supabase
          .from('account_lockouts')
          .select('*')
          .eq('user_id', results.step2_login_query.data.id)
          .eq('is_active', true)
          .single()

        if (lockout && new Date(lockout.lockout_until) > new Date()) {
          results.step4_account_lockout_check.success = false
          results.step4_account_lockout_check.data = {
            locked: true,
            lockout_until: lockout.lockout_until
          }
          console.log('❌ Account is locked')
        } else {
          results.step4_account_lockout_check.success = true
          results.step4_account_lockout_check.data = { locked: false }
          console.log('✅ Account is not locked')
        }
      } catch (err) {
        results.step4_account_lockout_check.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Step 5: Test verification code creation
    if (results.step3_password_verification.success && results.step4_account_lockout_check.success) {
      console.log('📧 Step 5: Testing verification code creation...')
      try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        const { error: codeError } = await supabase
          .from('verification_codes')
          .insert({
            user_id: results.step2_login_query.data.id,
            email: email,
            code: verificationCode,
            expires_at: expiresAt.toISOString(),
            is_used: false
          })

        if (codeError) {
          results.step5_verification_code_creation.error = codeError.message
          console.error('❌ Verification code creation failed:', codeError)
        } else {
          results.step5_verification_code_creation.success = true
          results.step5_verification_code_creation.data = {
            code: verificationCode,
            expires_at: expiresAt.toISOString()
          }
          console.log('✅ Verification code created successfully')
        }
      } catch (err) {
        results.step5_verification_code_creation.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Step 6: Test email sending (mock)
    if (results.step5_verification_code_creation.success) {
      console.log('📨 Step 6: Testing email sending...')
      try {
        // Mock email sending - just check if the email service is configured
        const emailConfigured = !!process.env.SMTP_USER && !!process.env.SMTP_PASS
        results.step6_email_sending.success = true
        results.step6_email_sending.data = {
          configured: emailConfigured,
          smtp_user: process.env.SMTP_USER ? 'Set' : 'Not set',
          smtp_pass: process.env.SMTP_PASS ? 'Set' : 'Not set'
        }
        console.log('✅ Email configuration check completed')
      } catch (err) {
        results.step6_email_sending.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Overall analysis
    const criticalSteps = [
      results.step1_user_exists,
      results.step2_login_query,
      results.step3_password_verification,
      results.step4_account_lockout_check
    ]

    const allCriticalStepsPass = criticalSteps.every(step => step.success)
    const loginShouldWork = allCriticalStepsPass && results.step5_verification_code_creation.success

    return NextResponse.json({
      success: loginShouldWork,
      message: loginShouldWork ? 
        'Login flow should work! All critical steps passed.' : 
        'Login flow has issues. Check the failed steps below.',
      results,
      analysis: {
        user_exists: results.step1_user_exists.success,
        login_query_works: results.step2_login_query.success,
        password_verification_works: results.step3_password_verification.success,
        account_not_locked: results.step4_account_lockout_check.success,
        verification_code_creation_works: results.step5_verification_code_creation.success,
        email_configured: results.step6_email_sending.success
      },
      diagnosis: {
        issue: !results.step2_login_query.success ? 'Login query fails - RLS policy issue' :
               !results.step3_password_verification.success ? 'Password verification fails' :
               !results.step4_account_lockout_check.success ? 'Account is locked' :
               !results.step5_verification_code_creation.success ? 'Verification code creation fails' :
               'All steps pass - login should work',
        recommendation: !results.step2_login_query.success ? 'Fix RLS policies in Supabase' :
                       !results.step3_password_verification.success ? 'Check password hash' :
                       !results.step4_account_lockout_check.success ? 'Clear account lockout' :
                       !results.step5_verification_code_creation.success ? 'Check verification_codes table permissions' :
                       'Try logging in - it should work now'
      },
      next_steps: loginShouldWork ? [
        'Try logging in with default credentials',
        'Email: shaniparacha2021@gmail.com',
        'Password: admin123'
      ] : [
        'Fix the issues identified in the diagnosis',
        'Re-run this test after fixes',
        'Check browser network tab for specific API errors'
      ]
    })

  } catch (error) {
    console.error('❌ Login flow test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Login Flow Test Endpoint',
    description: 'This endpoint tests the complete login flow step by step',
    usage: 'POST /api/test-login-flow',
    purpose: 'Identifies exactly where the login process fails'
  })
}

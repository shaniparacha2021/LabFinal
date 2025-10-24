import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnosing login issues...')
    
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'
    
    const results = {
      step1_database_connection: { success: false, error: null, data: null },
      step2_user_exists: { success: false, error: null, data: null },
      step3_login_query: { success: false, error: null, data: null },
      step4_password_verification: { success: false, error: null, data: null },
      step5_account_lockout: { success: false, error: null, data: null },
      overall_diagnosis: { success: false, issues: [], recommendations: [] }
    }

    // Step 1: Test basic database connection
    console.log('📊 Step 1: Testing database connection...')
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        results.step1_database_connection.error = error.message
        results.overall_diagnosis.issues.push('Database connection failed')
        results.overall_diagnosis.recommendations.push('Check Supabase configuration and credentials')
      } else {
        results.step1_database_connection.success = true
        results.step1_database_connection.data = 'Connected successfully'
      }
    } catch (err) {
      results.step1_database_connection.error = err instanceof Error ? err.message : 'Unknown error'
      results.overall_diagnosis.issues.push('Database connection failed')
    }

    // Step 2: Check if user exists (any role)
    console.log('👤 Step 2: Checking if user exists...')
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      
      if (error) {
        results.step2_user_exists.error = error.message
        results.overall_diagnosis.issues.push('User does not exist in database')
        results.overall_diagnosis.recommendations.push('Run POST /api/setup-super-admin to create the user')
      } else {
        results.step2_user_exists.success = true
        results.step2_user_exists.data = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash
        }
      }
    } catch (err) {
      results.step2_user_exists.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 3: Test exact login API query
    console.log('🔐 Step 3: Testing login API query...')
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', 'SUPER_ADMIN')
        .eq('is_active', true)
        .single()
      
      if (error) {
        results.step3_login_query.error = error.message
        if (error.message.includes('No rows returned')) {
          results.overall_diagnosis.issues.push('User exists but is not SUPER_ADMIN or not active')
          results.overall_diagnosis.recommendations.push('Update user role to SUPER_ADMIN and ensure is_active is true')
        } else {
          results.overall_diagnosis.issues.push('Login query failed')
        }
      } else {
        results.step3_login_query.success = true
        results.step3_login_query.data = {
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash
        }
      }
    } catch (err) {
      results.step3_login_query.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 4: Test password verification
    if (results.step3_login_query.success && results.step3_login_query.data) {
      console.log('🔑 Step 4: Testing password verification...')
      try {
        const user = results.step3_login_query.data
        let isValidPassword = false
        
        if (user.has_password_hash) {
          // We need to get the actual password hash from the database
          const { data: userWithHash } = await supabase
            .from('users')
            .select('password_hash')
            .eq('email', email)
            .single()
          
          if (userWithHash?.password_hash) {
            isValidPassword = await bcrypt.compare(password, userWithHash.password_hash)
          }
        } else {
          // Fallback verification
          isValidPassword = password === 'admin123'
        }
        
        results.step4_password_verification.success = isValidPassword
        results.step4_password_verification.data = {
          method: user.has_password_hash ? 'bcrypt' : 'fallback',
          result: isValidPassword
        }
        
        if (!isValidPassword) {
          results.overall_diagnosis.issues.push('Password verification failed')
          results.overall_diagnosis.recommendations.push('Check password hash or use fallback verification')
        }
      } catch (err) {
        results.step4_password_verification.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Step 5: Check account lockout
    if (results.step3_login_query.success && results.step3_login_query.data) {
      console.log('🔒 Step 5: Checking account lockout...')
      try {
        const { data: lockout } = await supabase
          .from('account_lockouts')
          .select('*')
          .eq('user_id', results.step3_login_query.data.id)
          .eq('is_active', true)
          .single()
        
        if (lockout && new Date(lockout.lockout_until) > new Date()) {
          results.step5_account_lockout.success = false
          results.step5_account_lockout.data = {
            locked: true,
            lockout_until: lockout.lockout_until
          }
          results.overall_diagnosis.issues.push('Account is locked')
          results.overall_diagnosis.recommendations.push('Wait for lockout to expire or clear lockout manually')
        } else {
          results.step5_account_lockout.success = true
          results.step5_account_lockout.data = { locked: false }
        }
      } catch (err) {
        results.step5_account_lockout.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Overall diagnosis
    const allStepsSuccessful = Object.values(results).every(step => 
      typeof step === 'object' && 'success' in step ? step.success : true
    )
    
    results.overall_diagnosis.success = allStepsSuccessful

    if (allStepsSuccessful) {
      results.overall_diagnosis.recommendations.push('All checks passed! Login should work. If it still fails, check the browser network tab for API errors.')
    }

    return NextResponse.json({
      success: true,
      message: 'Login diagnosis completed',
      results,
      summary: {
        total_issues: results.overall_diagnosis.issues.length,
        critical_issues: results.overall_diagnosis.issues,
        recommendations: results.overall_diagnosis.recommendations
      }
    })

  } catch (error) {
    console.error('❌ Diagnosis error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

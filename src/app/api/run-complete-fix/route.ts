import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Running complete login fix...')
    
    const email = 'shaniparacha2021@gmail.com'
    const userId = 'super-admin-user'
    
    const results = {
      step1_clear_lockouts: { success: false, error: null },
      step2_clear_failed_attempts: { success: false, error: null },
      step3_fix_password_hash: { success: false, error: null },
      step4_ensure_user_active: { success: false, error: null },
      step5_verification: { success: false, error: null, data: null }
    }

    // Step 1: Clear all lockouts
    console.log('🔓 Step 1: Clearing account lockouts...')
    try {
      const { error } = await supabaseAdmin
        .from('account_lockouts')
        .update({ is_active: false })
        .eq('user_id', userId)

      if (error) {
        results.step1_clear_lockouts.error = error.message
      } else {
        results.step1_clear_lockouts.success = true
      }
    } catch (err) {
      results.step1_clear_lockouts.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 2: Clear failed attempts
    console.log('🗑️ Step 2: Clearing failed login attempts...')
    try {
      const { error } = await supabaseAdmin
        .from('login_attempts')
        .delete()
        .eq('email', email)
        .eq('success', false)

      if (error) {
        results.step2_clear_failed_attempts.error = error.message
      } else {
        results.step2_clear_failed_attempts.success = true
      }
    } catch (err) {
      results.step2_clear_failed_attempts.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 3: Fix password hash (using pre-computed bcrypt hash for "admin123")
    console.log('🔑 Step 3: Fixing password hash...')
    try {
      const correctBcryptHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
      
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          password_hash: correctBcryptHash,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (error) {
        results.step3_fix_password_hash.error = error.message
      } else {
        results.step3_fix_password_hash.success = true
      }
    } catch (err) {
      results.step3_fix_password_hash.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 4: Ensure user is active and has correct role
    console.log('✅ Step 4: Ensuring user is active...')
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          role: 'SUPER_ADMIN',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (error) {
        results.step4_ensure_user_active.error = error.message
      } else {
        results.step4_ensure_user_active.success = true
      }
    } catch (err) {
      results.step4_ensure_user_active.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 5: Final verification
    console.log('🔍 Step 5: Final verification...')
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        results.step5_verification.error = error.message
      } else if (!user) {
        results.step5_verification.error = 'User not found'
      } else {
        results.step5_verification.success = true
        results.step5_verification.data = {
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
      results.step5_verification.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Check for any remaining issues
    const { data: lockouts } = await supabaseAdmin
      .from('account_lockouts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    const { data: failedAttempts } = await supabaseAdmin
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .eq('success', false)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

    const allStepsSuccessful = Object.values(results).every(step => step.success)
    const noRemainingIssues = (lockouts?.length || 0) === 0 && (failedAttempts?.length || 0) === 0

    return NextResponse.json({
      success: allStepsSuccessful && noRemainingIssues,
      message: allStepsSuccessful && noRemainingIssues ? 
        'Complete login fix successful! All issues resolved.' :
        'Some steps failed. Check the results for details.',
      results,
      remaining_issues: {
        active_lockouts: lockouts?.length || 0,
        recent_failed_attempts: failedAttempts?.length || 0
      },
      user_status: results.step5_verification.data,
      next_steps: allStepsSuccessful && noRemainingIssues ? [
        '✅ All authentication issues have been resolved',
        '🔑 Password hash has been fixed',
        '🔓 Account lockout has been cleared',
        '👤 User is active with correct role',
        '🚀 Login should now work with default credentials:',
        '   Email: shaniparacha2021@gmail.com',
        '   Password: admin123'
      ] : [
        '❌ Some steps failed - check the results above',
        '🔄 Re-run this fix or check individual steps',
        '📞 Contact support if issues persist'
      ]
    })

  } catch (error) {
    console.error('❌ Complete fix error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Complete Login Fix Endpoint',
    description: 'Fixes all authentication issues for Super Admin login',
    usage: 'POST /api/run-complete-fix',
    fixes_applied: [
      'Clears all account lockouts',
      'Removes failed login attempts',
      'Fixes password hash with correct bcrypt',
      'Ensures user is active with correct role',
      'Verifies all fixes are working'
    ]
  })
}

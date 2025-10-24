import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔓 Clearing account lockouts...')
    
    const email = 'shaniparacha2021@gmail.com'
    
    // Get the user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: userError?.message
      }, { status: 404 })
    }

    // Clear all active lockouts for this user
    const { error: lockoutError } = await supabaseAdmin
      .from('account_lockouts')
      .update({ is_active: false })
      .eq('user_id', user.id)

    if (lockoutError) {
      console.error('❌ Error clearing lockouts:', lockoutError)
      return NextResponse.json({
        success: false,
        error: 'Failed to clear lockouts',
        details: lockoutError.message
      }, { status: 500 })
    }

    // Also clear recent failed login attempts
    const { error: attemptsError } = await supabaseAdmin
      .from('login_attempts')
      .delete()
      .eq('email', email)
      .eq('success', false)

    if (attemptsError) {
      console.error('❌ Error clearing failed attempts:', attemptsError)
      // Don't fail the request, just log it
    }

    console.log('✅ Account lockouts cleared successfully')

    return NextResponse.json({
      success: true,
      message: 'Account lockouts cleared successfully',
      user: {
        id: user.id,
        email: email
      },
      actions_taken: [
        'Cleared all active account lockouts',
        'Cleared recent failed login attempts',
        'Account is now unlocked and ready for login'
      ],
      next_steps: [
        'Try logging in again with default credentials',
        'Email: shaniparacha2021@gmail.com',
        'Password: admin123'
      ]
    })

  } catch (error) {
    console.error('❌ Clear lockout error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking account lockout status...')
    
    const email = 'shaniparacha2021@gmail.com'
    
    // Get the user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: userError?.message
      }, { status: 404 })
    }

    // Check for active lockouts
    const { data: lockouts, error: lockoutError } = await supabaseAdmin
      .from('account_lockouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (lockoutError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check lockouts',
        details: lockoutError.message
      }, { status: 500 })
    }

    // Check recent failed attempts
    const { data: failedAttempts, error: attemptsError } = await supabaseAdmin
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .eq('success', false)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

    const isLocked = lockouts && lockouts.length > 0 && lockouts.some(lockout => 
      new Date(lockout.lockout_until) > new Date()
    )

    return NextResponse.json({
      success: true,
      message: 'Account lockout status checked',
      user: {
        id: user.id,
        email: email
      },
      lockout_status: {
        is_locked: isLocked,
        active_lockouts: lockouts?.length || 0,
        recent_failed_attempts: failedAttempts?.length || 0
      },
      lockouts: lockouts || [],
      failed_attempts: failedAttempts || [],
      recommendation: isLocked ? 
        'Account is locked. Run POST /api/clear-lockout to unlock it.' :
        'Account is not locked. Login should work normally.'
    })

  } catch (error) {
    console.error('❌ Check lockout error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

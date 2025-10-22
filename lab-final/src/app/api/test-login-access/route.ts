import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const email = 'shaniparacha2021@gmail.com'

    console.log('🔍 Testing what the login API can access...')

    // Test 1: Try to query users table (same as login API)
    console.log('👤 Testing user query (same as login API)...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    console.log('User query result:', { user, userError })

    // Test 2: Try to query without role filter
    console.log('👤 Testing user query without role filter...')
    const { data: userNoRole, error: userNoRoleError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    console.log('User query (no role filter) result:', { userNoRole, userNoRoleError })

    // Test 3: Try to query all users
    console.log('👥 Testing query all users...')
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)

    console.log('All users query result:', { allUsers, allUsersError })

    // Test 4: Check if we can access account_lockouts
    console.log('🔒 Testing account_lockouts access...')
    const { data: lockouts, error: lockoutsError } = await supabase
      .from('account_lockouts')
      .select('*')
      .limit(1)

    console.log('Account lockouts query result:', { lockouts, lockoutsError })

    return NextResponse.json({
      success: true,
      message: 'Login API access test completed',
      results: {
        user_query_with_role: {
          success: !userError,
          user: user,
          error: userError?.message,
          code: userError?.code
        },
        user_query_without_role: {
          success: !userNoRoleError,
          user: userNoRole,
          error: userNoRoleError?.message,
          code: userNoRoleError?.code
        },
        all_users_query: {
          success: !allUsersError,
          users: allUsers,
          error: allUsersError?.message,
          code: allUsersError?.code
        },
        account_lockouts_query: {
          success: !lockoutsError,
          lockouts: lockouts,
          error: lockoutsError?.message,
          code: lockoutsError?.code
        }
      },
      analysis: {
        if_user_query_fails: 'The login API cannot see the user due to RLS policies',
        if_user_query_succeeds: 'The login API can see the user, issue is elsewhere',
        recommendation: 'If user query fails, we need to fix RLS policies or use admin client in login API'
      }
    })

  } catch (error) {
    console.error('❌ Test login access error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

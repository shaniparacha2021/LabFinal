import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking RLS policies...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 })
    }
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Check if RLS is enabled on users table
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('check_rls_status', { table_name: 'users' })
      .catch(async () => {
        // If the function doesn't exist, try a different approach
        try {
          // Try to query the users table directly
          const { data, error } = await supabaseAdmin
            .from('users')
            .select('count')
            .limit(1)
          
          return { data: { rls_enabled: error ? 'unknown' : 'disabled' }, error }
        } catch (e) {
          return { data: { rls_enabled: 'error' }, error: e }
        }
      })
    
    // Try to get table information
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
    
    // Try to get policy information
    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users')
    
    return NextResponse.json({
      success: true,
      message: 'RLS status check completed',
      rls_status: {
        status: rlsStatus?.rls_enabled || 'unknown',
        error: rlsError?.message
      },
      table_info: {
        exists: !!tableInfo?.length,
        details: tableInfo?.[0] || null,
        error: tableError?.message
      },
      policies: {
        count: policies?.length || 0,
        details: policies || [],
        error: policyError?.message
      },
      recommendations: {
        if_rls_enabled: 'RLS is enabled. You may need to disable it temporarily or fix the policies.',
        if_rls_disabled: 'RLS is disabled. User creation should work.',
        if_policies_exist: 'Policies exist that might be causing recursion. Consider dropping them.',
        solution: 'Use /api/setup-user-admin to create user with admin privileges'
      }
    })

  } catch (error) {
    console.error('❌ RLS check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

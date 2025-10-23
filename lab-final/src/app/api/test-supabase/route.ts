import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    const results = {
      regular_client: { success: false, error: null, data: null },
      admin_client: { success: false, error: null, data: null },
      user_query: { success: false, error: null, data: null }
    }

    // Test 1: Regular client connection
    console.log('📡 Testing regular Supabase client...')
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        results.regular_client.error = error.message
        console.error('❌ Regular client error:', error)
      } else {
        results.regular_client.success = true
        results.regular_client.data = 'Connected successfully'
        console.log('✅ Regular client connected')
      }
    } catch (err) {
      results.regular_client.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Test 2: Admin client connection
    console.log('🔧 Testing admin Supabase client...')
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        results.admin_client.error = error.message
        console.error('❌ Admin client error:', error)
      } else {
        results.admin_client.success = true
        results.admin_client.data = 'Connected successfully'
        console.log('✅ Admin client connected')
      }
    } catch (err) {
      results.admin_client.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Test 3: Query for Super Admin user
    console.log('👤 Testing Super Admin user query...')
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', 'shaniparacha2021@gmail.com')
        .single()
      
      if (error) {
        results.user_query.error = error.message
        console.error('❌ User query error:', error)
      } else if (!user) {
        results.user_query.error = 'User not found'
        console.error('❌ User not found')
      } else {
        results.user_query.success = true
        results.user_query.data = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash
        }
        console.log('✅ Super Admin user found:', user.email)
      }
    } catch (err) {
      results.user_query.error = err instanceof Error ? err.message : 'Unknown error'
    }

    const allTestsPass = Object.values(results).every(test => test.success)

    return NextResponse.json({
      success: allTestsPass,
      message: allTestsPass ? 
        'All Supabase tests passed! Database is working correctly.' : 
        'Some Supabase tests failed. Check the errors below.',
      results,
      environment_check: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
        supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
      },
      recommendations: !results.regular_client.success ? [
        'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ] : !results.admin_client.success ? [
        'Check SUPABASE_SERVICE_ROLE_KEY'
      ] : !results.user_query.success ? [
        'Run the quick-fix.sql script in Supabase Dashboard',
        'The Super Admin user may not exist or RLS policies are blocking access'
      ] : [
        'All tests passed! The database is working correctly.',
        'If login still fails, the issue is in the login API logic'
      ]
    })

  } catch (error) {
    console.error('❌ Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
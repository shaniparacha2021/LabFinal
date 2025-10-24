import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      success: true,
      message: 'Subscription system test completed',
      tests: []
    }

    // Test 1: Check if subscription tables exist
    console.log('1. Testing subscription tables existence...')
    const tables = [
      'subscription_plans',
      'admin_subscriptions', 
      'subscription_payments',
      'subscription_reminders',
      'subscription_notifications'
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          results.tests.push({
            test: `Table ${table} exists`,
            success: false,
            error: error.message
          })
        } else {
          results.tests.push({
            test: `Table ${table} exists`,
            success: true,
            note: 'Table accessible'
          })
        }
      } catch (err) {
        results.tests.push({
          test: `Table ${table} exists`,
          success: false,
          error: `Table does not exist: ${err}`
        })
      }
    }

    // Test 2: Check subscription plans
    console.log('2. Testing subscription plans...')
    try {
      const { data: plans, error: plansError } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')

      if (plansError) {
        results.tests.push({
          test: 'Subscription plans accessible',
          success: false,
          error: plansError.message
        })
      } else {
        results.tests.push({
          test: 'Subscription plans accessible',
          success: true,
          note: `Found ${plans?.length || 0} plans`,
          data: plans
        })
      }
    } catch (err) {
      results.tests.push({
        test: 'Subscription plans accessible',
        success: false,
        error: `Error: ${err}`
      })
    }

    // Test 3: Check if admins table exists and has data
    console.log('3. Testing admins table...')
    try {
      const { data: admins, error: adminsError } = await supabaseAdmin
        .from('admins')
        .select('id, full_name, email')
        .limit(5)

      if (adminsError) {
        results.tests.push({
          test: 'Admins table accessible',
          success: false,
          error: adminsError.message
        })
      } else {
        results.tests.push({
          test: 'Admins table accessible',
          success: true,
          note: `Found ${admins?.length || 0} admins`,
          data: admins
        })
      }
    } catch (err) {
      results.tests.push({
        test: 'Admins table accessible',
        success: false,
        error: `Error: ${err}`
      })
    }

    // Test 4: Test subscription creation function
    console.log('4. Testing subscription creation function...')
    try {
      // First get an admin ID
      const { data: admin } = await supabaseAdmin
        .from('admins')
        .select('id')
        .limit(1)
        .single()

      if (admin) {
        const { data: subscriptionId, error: createError } = await supabaseAdmin
          .rpc('create_admin_subscription', {
            p_admin_id: admin.id,
            p_plan_type: 'TRIAL',
            p_start_date: new Date().toISOString(),
            p_auto_renew: false,
            p_created_by: 'test-user'
          })

        if (createError) {
          results.tests.push({
            test: 'Subscription creation function',
            success: false,
            error: createError.message
          })
        } else {
          results.tests.push({
            test: 'Subscription creation function',
            success: true,
            note: `Created subscription: ${subscriptionId}`,
            data: { subscriptionId }
          })

          // Clean up test subscription
          await supabaseAdmin
            .from('admin_subscriptions')
            .delete()
            .eq('id', subscriptionId)
        }
      } else {
        results.tests.push({
          test: 'Subscription creation function',
          success: false,
          error: 'No admin found to test with'
        })
      }
    } catch (err) {
      results.tests.push({
        test: 'Subscription creation function',
        success: false,
        error: `Error: ${err}`
      })
    }

    // Test 5: Check RLS policies
    console.log('5. Testing RLS policies...')
    try {
      const { data: policies, error: policiesError } = await supabaseAdmin
        .rpc('get_rls_policies', { table_name: 'admin_subscriptions' })

      if (policiesError) {
        results.tests.push({
          test: 'RLS policies check',
          success: false,
          error: policiesError.message
        })
      } else {
        results.tests.push({
          test: 'RLS policies check',
          success: true,
          note: 'RLS policies accessible',
          data: policies
        })
      }
    } catch (err) {
      results.tests.push({
        test: 'RLS policies check',
        success: false,
        error: `Error: ${err}`
      })
    }

    // Test 6: Check column types
    console.log('6. Testing column types...')
    try {
      const { data: columns, error: columnsError } = await supabaseAdmin
        .rpc('get_table_columns', { table_name: 'admin_subscriptions' })

      if (columnsError) {
        results.tests.push({
          test: 'Column types check',
          success: false,
          error: columnsError.message
        })
      } else {
        const adminIdColumn = columns?.find((col: any) => col.column_name === 'admin_id')
        if (adminIdColumn && adminIdColumn.data_type === 'text') {
          results.tests.push({
            test: 'Column types check',
            success: true,
            note: 'admin_id column is TEXT type (correct)',
            data: { adminIdType: adminIdColumn.data_type }
          })
        } else {
          results.tests.push({
            test: 'Column types check',
            success: false,
            error: `admin_id column type is ${adminIdColumn?.data_type || 'unknown'}, should be TEXT`
          })
        }
      }
    } catch (err) {
      results.tests.push({
        test: 'Column types check',
        success: false,
        error: `Error: ${err}`
      })
    }

    // Calculate overall success
    const failedTests = results.tests.filter((test: any) => !test.success)
    if (failedTests.length > 0) {
      results.success = false
      results.message = `${failedTests.length} test(s) failed`
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Subscription system test error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Test failed with error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

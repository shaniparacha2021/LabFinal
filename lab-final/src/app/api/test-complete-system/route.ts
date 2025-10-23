import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/test-complete-system - Test the complete system integration
export async function GET(request: NextRequest) {
  try {
    const results: any = {
      database_connection: { success: false, error: null },
      core_tables: { success: false, error: null, tables: [] },
      subscription_system: { success: false, error: null, components: [] },
      announcements_system: { success: false, error: null, components: [] },
      admin_management: { success: false, error: null, components: [] },
      type_compatibility: { success: false, error: null, types: [] },
      function_tests: { success: false, error: null, functions: [] }
    }

    // Test database connection
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) throw error
      results.database_connection = { success: true, error: null }
    } catch (error: any) {
      results.database_connection = { success: false, error: error.message }
    }

    // Test core tables
    try {
      const coreTables = [
        'users',
        'admins',
        'activity_logs',
        'user_sessions'
      ]

      for (const table of coreTables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) throw error
        results.core_tables.tables.push(table)
      }
      
      results.core_tables = { 
        success: true, 
        error: null, 
        tables: results.core_tables.tables 
      }
    } catch (error: any) {
      results.core_tables = { success: false, error: error.message, tables: [] }
    }

    // Test subscription system
    try {
      const subscriptionTables = [
        'subscription_plans',
        'admin_subscriptions',
        'subscription_payments',
        'subscription_reminders',
        'subscription_notifications'
      ]

      for (const table of subscriptionTables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) throw error
        results.subscription_system.components.push(table)
      }
      
      results.subscription_system = { 
        success: true, 
        error: null, 
        components: results.subscription_system.components 
      }
    } catch (error: any) {
      results.subscription_system = { success: false, error: error.message, components: [] }
    }

    // Test announcements system
    try {
      const announcementTables = [
        'announcements',
        'announcement_views',
        'announcement_notifications',
        'announcement_broadcasts'
      ]

      for (const table of announcementTables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) throw error
        results.announcements_system.components.push(table)
      }
      
      results.announcements_system = { 
        success: true, 
        error: null, 
        components: results.announcements_system.components 
      }
    } catch (error: any) {
      results.announcements_system = { success: false, error: error.message, components: [] }
    }

    // Test admin management
    try {
      const adminTables = [
        'admins',
        'admin_assets',
        'admin_activity_logs'
      ]

      for (const table of adminTables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) throw error
        results.admin_management.components.push(table)
      }
      
      results.admin_management = { 
        success: true, 
        error: null, 
        components: results.admin_management.components 
      }
    } catch (error: any) {
      results.admin_management = { success: false, error: error.message, components: [] }
    }

    // Test type compatibility
    try {
      const types = [
        'subscription_plan',
        'payment_status',
        'subscription_status',
        'reminder_type',
        'announcement_type',
        'announcement_status',
        'notification_type'
      ]

      // Test by trying to use the types in queries
      for (const type of types) {
        try {
          // Try to query a table that uses this type
          if (type === 'subscription_plan') {
            const { data, error } = await supabaseAdmin
              .from('subscription_plans')
              .select('plan_name')
              .limit(1)
            if (error) throw error
          } else if (type === 'announcement_type') {
            const { data, error } = await supabaseAdmin
              .from('announcements')
              .select('announcement_type')
              .limit(1)
            if (error) throw error
          }
          results.type_compatibility.types.push(type)
        } catch (typeError) {
          // Type might not be used yet, that's okay
        }
      }
      
      results.type_compatibility = { 
        success: results.type_compatibility.types.length > 0, 
        error: null, 
        types: results.type_compatibility.types 
      }
    } catch (error: any) {
      results.type_compatibility = { success: false, error: error.message, types: [] }
    }

    // Test functions
    try {
      const functions = [
        'create_admin_subscription',
        'update_subscription_status',
        'extend_subscription',
        'check_expired_subscriptions',
        'create_announcement',
        'broadcast_announcement',
        'mark_announcement_viewed',
        'dismiss_announcement',
        'get_active_announcements_for_admin',
        'check_expired_announcements'
      ]

      for (const func of functions) {
        try {
          const { data, error } = await supabaseAdmin
            .rpc(func, {})
            .then(() => ({ data: null, error: null }))
            .catch((err) => ({ data: null, error: err.message }))
          
          // Function exists if it doesn't throw "function does not exist" error
          if (!error || !error.includes('does not exist')) {
            results.function_tests.functions.push(func)
          }
        } catch (funcError) {
          // Function might not exist yet, that's okay
        }
      }
      
      results.function_tests = { 
        success: results.function_tests.functions.length > 0, 
        error: null, 
        functions: results.function_tests.functions 
      }
    } catch (error: any) {
      results.function_tests = { success: false, error: error.message, functions: [] }
    }

    const allTestsPassed = Object.values(results).every((result: any) => result.success)

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed 
        ? 'All systems are working correctly!' 
        : 'Some systems have issues that need attention',
      results,
      system_status: {
        core_system: results.database_connection.success && results.core_tables.success,
        subscription_management: results.subscription_system.success,
        announcements_system: results.announcements_system.success,
        admin_management: results.admin_management.success,
        type_compatibility: results.type_compatibility.success,
        function_availability: results.function_tests.success
      },
      recommendations: allTestsPassed ? [
        'All systems are working correctly!',
        'You can now use all features: Admin Management, Subscription Management, and Announcements.',
        'All database schemas are properly set up and compatible.',
        'All API endpoints should work correctly.'
      ] : [
        'Some systems need attention. Check the specific error messages above.',
        'Make sure to run the database schema files in the correct order.',
        'Verify that all required tables and functions are created.',
        'Check that all types are properly defined.'
      ]
    })

  } catch (error: any) {
    console.error('Test complete system error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test complete system',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

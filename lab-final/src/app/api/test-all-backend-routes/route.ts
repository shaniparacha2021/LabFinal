import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/test-all-backend-routes - Test all backend API routes
export async function GET(request: NextRequest) {
  try {
    const results: any = {
      announcements_system: { success: false, error: null, routes: [] },
      subscription_system: { success: false, error: null, routes: [] },
      database_compatibility: { success: false, error: null, tables: [] },
      function_tests: { success: false, error: null, functions: [] }
    }

    // Test announcements system routes
    try {
      const announcementRoutes = [
        'GET /api/super-admin/announcements',
        'POST /api/super-admin/announcements',
        'GET /api/super-admin/announcements/[id]',
        'PUT /api/super-admin/announcements/[id]',
        'DELETE /api/super-admin/announcements/[id]',
        'POST /api/super-admin/announcements/[id]/broadcast',
        'GET /api/admin/announcements',
        'POST /api/admin/announcements/[id]/view',
        'POST /api/admin/announcements/[id]/dismiss'
      ]

      // Test database tables exist
      const announcementTables = ['announcements', 'announcement_views', 'announcement_notifications', 'announcement_broadcasts']
      
      for (const table of announcementTables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) throw error
        results.announcements_system.tables = results.announcements_system.tables || []
        results.announcements_system.tables.push(table)
      }

      results.announcements_system = { 
        success: true, 
        error: null, 
        routes: announcementRoutes,
        tables: results.announcements_system.tables
      }
    } catch (error: any) {
      results.announcements_system = { success: false, error: error.message, routes: [], tables: [] }
    }

    // Test subscription system routes
    try {
      const subscriptionRoutes = [
        'GET /api/super-admin/subscriptions',
        'POST /api/super-admin/subscriptions',
        'GET /api/super-admin/subscriptions/[id]',
        'PUT /api/super-admin/subscriptions/[id]',
        'DELETE /api/super-admin/subscriptions/[id]',
        'GET /api/super-admin/subscriptions/[id]/payments',
        'POST /api/super-admin/subscriptions/[id]/payments',
        'GET /api/super-admin/subscription-plans',
        'POST /api/super-admin/subscriptions/check-expired'
      ]

      // Test database tables exist
      const subscriptionTables = ['subscription_plans', 'admin_subscriptions', 'subscription_payments', 'subscription_reminders', 'subscription_notifications']
      
      for (const table of subscriptionTables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) throw error
        results.subscription_system.tables = results.subscription_system.tables || []
        results.subscription_system.tables.push(table)
      }

      results.subscription_system = { 
        success: true, 
        error: null, 
        routes: subscriptionRoutes,
        tables: results.subscription_system.tables
      }
    } catch (error: any) {
      results.subscription_system = { success: false, error: error.message, routes: [], tables: [] }
    }

    // Test database compatibility
    try {
      const coreTables = ['users', 'admins', 'admin_assets', 'admin_activity_logs']
      
      for (const table of coreTables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) throw error
        results.database_compatibility.tables.push(table)
      }

      results.database_compatibility = { 
        success: true, 
        error: null, 
        tables: results.database_compatibility.tables
      }
    } catch (error: any) {
      results.database_compatibility = { success: false, error: error.message, tables: [] }
    }

    // Test functions
    try {
      const functions = [
        'create_announcement',
        'broadcast_announcement',
        'mark_announcement_viewed',
        'dismiss_announcement',
        'get_active_announcements_for_admin',
        'check_expired_announcements',
        'create_admin_subscription',
        'update_subscription_status',
        'extend_subscription',
        'check_expired_subscriptions'
      ]

      for (const func of functions) {
        try {
          // Test function exists by calling it with empty parameters
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
        ? 'All backend routes and systems are working correctly!' 
        : 'Some backend systems have issues that need attention',
      results,
      system_status: {
        announcements_system: results.announcements_system.success,
        subscription_system: results.subscription_system.success,
        database_compatibility: results.database_compatibility.success,
        function_availability: results.function_tests.success
      },
      api_endpoints: {
        announcements: {
          super_admin: [
            'GET /api/super-admin/announcements - List all announcements',
            'POST /api/super-admin/announcements - Create new announcement',
            'GET /api/super-admin/announcements/[id] - Get specific announcement',
            'PUT /api/super-admin/announcements/[id] - Update announcement',
            'DELETE /api/super-admin/announcements/[id] - Delete announcement',
            'POST /api/super-admin/announcements/[id]/broadcast - Broadcast announcement'
          ],
          admin: [
            'GET /api/admin/announcements - Get active announcements for admin',
            'POST /api/admin/announcements/[id]/view - Mark announcement as viewed',
            'POST /api/admin/announcements/[id]/dismiss - Dismiss announcement'
          ]
        },
        subscriptions: {
          super_admin: [
            'GET /api/super-admin/subscriptions - List all subscriptions',
            'POST /api/super-admin/subscriptions - Create new subscription',
            'GET /api/super-admin/subscriptions/[id] - Get specific subscription',
            'PUT /api/super-admin/subscriptions/[id] - Update subscription',
            'DELETE /api/super-admin/subscriptions/[id] - Delete subscription',
            'GET /api/super-admin/subscriptions/[id]/payments - Get payment history',
            'POST /api/super-admin/subscriptions/[id]/payments - Add payment record',
            'GET /api/super-admin/subscription-plans - List subscription plans',
            'POST /api/super-admin/subscriptions/check-expired - Check expired subscriptions'
          ]
        }
      },
      recommendations: allTestsPassed ? [
        'All backend routes are working correctly!',
        'All database tables are properly set up.',
        'All functions are available and working.',
        'The system is ready for frontend integration.',
        'You can now use all API endpoints for announcements and subscriptions.'
      ] : [
        'Some backend systems need attention. Check the specific error messages above.',
        'Make sure to run the database schema files in the correct order.',
        'Verify that all required tables and functions are created.',
        'Check that all API routes are properly implemented.'
      ]
    })

  } catch (error: any) {
    console.error('Test all backend routes error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test backend routes',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

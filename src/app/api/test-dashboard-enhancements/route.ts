import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const testResults = {
      database_tables: {
        backup_history: { exists: false, error: null },
        restore_history: { exists: false, error: null }
      },
      api_endpoints: {
        enhanced_stats: { available: false, error: null },
        subscription_analytics: { available: false, error: null },
        admin_activity: { available: false, error: null },
        backup_history: { available: false, error: null },
        create_backup: { available: false, error: null }
      },
      database_functions: {
        create_backup: { exists: false, error: null },
        update_backup_status: { exists: false, error: null },
        get_backup_history: { exists: false, error: null },
        get_backup_statistics: { exists: false, error: null },
        create_restore: { exists: false, error: null },
        update_restore_status: { exists: false, error: null }
      },
      frontend_components: {
        enhanced_dashboard: { exists: false, error: null },
        quick_stats_widget: { exists: false, error: null },
        analytics_chart: { exists: false, error: null },
        search_filter_widget: { exists: false, error: null }
      }
    }

    // Test database tables
    try {
      const { data: backupHistory, error: backupError } = await supabaseAdmin
        .from('backup_history')
        .select('id')
        .limit(1)
      
      testResults.database_tables.backup_history = {
        exists: !backupError,
        error: backupError?.message || null
      }
    } catch (error: any) {
      testResults.database_tables.backup_history = {
        exists: false,
        error: error.message
      }
    }

    try {
      const { data: restoreHistory, error: restoreError } = await supabaseAdmin
        .from('restore_history')
        .select('id')
        .limit(1)
      
      testResults.database_tables.restore_history = {
        exists: !restoreError,
        error: restoreError?.message || null
      }
    } catch (error: any) {
      testResults.database_tables.restore_history = {
        exists: false,
        error: error.message
      }
    }

    // Test database functions
    const functions = [
      'create_backup',
      'update_backup_status',
      'get_backup_history',
      'get_backup_statistics',
      'create_restore',
      'update_restore_status'
    ]

    for (const funcName of functions) {
      try {
        const { error } = await supabaseAdmin
          .rpc(funcName, {})
        
        testResults.database_functions[funcName] = {
          exists: !error || error.message.includes('function') === false,
          error: error?.message || null
        }
      } catch (error: any) {
        testResults.database_functions[funcName] = {
          exists: false,
          error: error.message
        }
      }
    }

    // Test API endpoints (simulate requests)
    const apiEndpoints = [
      '/api/super-admin/dashboard/enhanced-stats',
      '/api/super-admin/dashboard/subscription-analytics',
      '/api/super-admin/dashboard/admin-activity',
      '/api/super-admin/dashboard/backup-history',
      '/api/super-admin/dashboard/create-backup'
    ]

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const endpointKey = endpoint.split('/').pop()?.replace('-', '_') || 'unknown'
        testResults.api_endpoints[endpointKey] = {
          available: response.status !== 404,
          error: response.status === 404 ? 'Endpoint not found' : null
        }
      } catch (error: any) {
        const endpointKey = endpoint.split('/').pop()?.replace('-', '_') || 'unknown'
        testResults.api_endpoints[endpointKey] = {
          available: false,
          error: error.message
        }
      }
    }

    // Test frontend components (check if files exist)
    const frontendComponents = [
      'src/app/(dashboard)/super-admin/dashboard/enhanced/page.tsx',
      'src/components/dashboard/widgets/QuickStatsWidget.tsx',
      'src/components/dashboard/widgets/AnalyticsChart.tsx',
      'src/components/dashboard/widgets/SearchFilterWidget.tsx'
    ]

    for (const component of frontendComponents) {
      try {
        const fs = require('fs')
        const path = require('path')
        const componentPath = path.join(process.cwd(), component)
        const exists = fs.existsSync(componentPath)
        
        const componentKey = component.split('/').pop()?.replace('.tsx', '').replace('-', '_') || 'unknown'
        testResults.frontend_components[componentKey] = {
          exists,
          error: exists ? null : 'Component file not found'
        }
      } catch (error: any) {
        const componentKey = component.split('/').pop()?.replace('.tsx', '').replace('-', '_') || 'unknown'
        testResults.frontend_components[componentKey] = {
          exists: false,
          error: error.message
        }
      }
    }

    // Calculate overall status
    const allTests = [
      ...Object.values(testResults.database_tables),
      ...Object.values(testResults.database_functions),
      ...Object.values(testResults.api_endpoints),
      ...Object.values(testResults.frontend_components)
    ]

    const passedTests = allTests.filter(test => test.exists || test.available).length
    const totalTests = allTests.length
    const allTestsPassed = passedTests === totalTests

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed 
        ? 'All dashboard enhancements are working correctly!' 
        : `Dashboard enhancements partially working (${passedTests}/${totalTests} tests passed)`,
      results: testResults,
      summary: {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: totalTests - passedTests,
        success_rate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
      },
      recommendations: allTestsPassed ? [
        '✅ All dashboard enhancements are properly implemented',
        '✅ Database tables and functions are working',
        '✅ API endpoints are accessible',
        '✅ Frontend components are available',
        '🎯 Dashboard is ready for production use'
      ] : [
        '⚠️ Some dashboard enhancements need attention',
        '🔧 Check database setup for backup_history and restore_history tables',
        '🔧 Verify all API endpoints are properly deployed',
        '🔧 Ensure frontend components are in correct locations',
        '📋 Review failed tests and fix issues before production deployment'
      ]
    })

  } catch (error) {
    console.error('Dashboard enhancements test error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test dashboard enhancements',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

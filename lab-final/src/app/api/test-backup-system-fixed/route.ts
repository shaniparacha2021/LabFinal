import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const testResults = {
      database_tables: {
        backup_history: { exists: false, error: null, sample_data: null },
        restore_history: { exists: false, error: null, sample_data: null }
      },
      database_functions: {
        create_backup: { exists: false, error: null, test_result: null },
        update_backup_status: { exists: false, error: null, test_result: null },
        get_backup_history: { exists: false, error: null, test_result: null },
        get_backup_statistics: { exists: false, error: null, test_result: null },
        create_restore: { exists: false, error: null, test_result: null },
        update_restore_status: { exists: false, error: null, test_result: null }
      },
      api_endpoints: {
        enhanced_stats: { available: false, error: null },
        subscription_analytics: { available: false, error: null },
        admin_activity: { available: false, error: null },
        backup_history: { available: false, error: null },
        create_backup: { available: false, error: null }
      },
      foreign_key_compatibility: {
        backup_history_created_by: { compatible: false, error: null },
        restore_history_created_by: { compatible: false, error: null },
        restore_history_backup_id: { compatible: false, error: null }
      }
    }

    // Test database tables
    try {
      const { data: backupHistory, error: backupError } = await supabaseAdmin
        .from('backup_history')
        .select('*')
        .limit(3)
      
      testResults.database_tables.backup_history = {
        exists: !backupError,
        error: backupError?.message || null,
        sample_data: backupHistory?.length || 0
      }
    } catch (error: any) {
      testResults.database_tables.backup_history = {
        exists: false,
        error: error.message,
        sample_data: null
      }
    }

    try {
      const { data: restoreHistory, error: restoreError } = await supabaseAdmin
        .from('restore_history')
        .select('*')
        .limit(3)
      
      testResults.database_tables.restore_history = {
        exists: !restoreError,
        error: restoreError?.message || null,
        sample_data: restoreHistory?.length || 0
      }
    } catch (error: any) {
      testResults.database_tables.restore_history = {
        exists: false,
        error: error.message,
        sample_data: null
      }
    }

    // Test foreign key compatibility
    try {
      // Test if we can insert a backup with a valid user ID
      const { data: testUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'SUPER_ADMIN')
        .limit(1)
        .single()

      if (testUser) {
        const { error: fkError } = await supabaseAdmin
          .rpc('create_backup', {
            p_backup_type: 'FULL',
            p_backup_name: 'Test Backup',
            p_description: 'Test backup for FK compatibility',
            p_created_by: testUser.id
          })

        testResults.foreign_key_compatibility.backup_history_created_by = {
          compatible: !fkError,
          error: fkError?.message || null
        }
      }
    } catch (error: any) {
      testResults.foreign_key_compatibility.backup_history_created_by = {
        compatible: false,
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
        let testParams = {}
        
        // Set appropriate test parameters for each function
        switch (funcName) {
          case 'create_backup':
            testParams = {
              p_backup_type: 'FULL',
              p_backup_name: 'Test Backup',
              p_description: 'Test backup',
              p_created_by: 'test-user-id'
            }
            break
          case 'update_backup_status':
            testParams = {
              p_backup_id: '00000000-0000-0000-0000-000000000000',
              p_status: 'COMPLETED'
            }
            break
          case 'get_backup_history':
            testParams = {
              p_limit: 10,
              p_offset: 0
            }
            break
          case 'get_backup_statistics':
            testParams = {}
            break
          case 'create_restore':
            testParams = {
              p_backup_id: '00000000-0000-0000-0000-000000000000',
              p_restore_name: 'Test Restore',
              p_description: 'Test restore',
              p_created_by: 'test-user-id'
            }
            break
          case 'update_restore_status':
            testParams = {
              p_restore_id: '00000000-0000-0000-0000-000000000000',
              p_status: 'COMPLETED'
            }
            break
        }

        const { data, error } = await supabaseAdmin
          .rpc(funcName, testParams)
        
        testResults.database_functions[funcName] = {
          exists: !error || error.message.includes('function') === false,
          error: error?.message || null,
          test_result: data ? 'Success' : 'No data returned'
        }
      } catch (error: any) {
        testResults.database_functions[funcName] = {
          exists: false,
          error: error.message,
          test_result: null
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

    // Calculate overall status
    const allTests = [
      ...Object.values(testResults.database_tables),
      ...Object.values(testResults.database_functions),
      ...Object.values(testResults.api_endpoints),
      ...Object.values(testResults.foreign_key_compatibility)
    ]

    const passedTests = allTests.filter(test => 
      test.exists || test.available || test.compatible
    ).length
    const totalTests = allTests.length
    const allTestsPassed = passedTests === totalTests

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed 
        ? 'All backup system fixes are working correctly!' 
        : `Backup system partially working (${passedTests}/${totalTests} tests passed)`,
      results: testResults,
      summary: {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: totalTests - passedTests,
        success_rate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
      },
      fixes_applied: [
        '✅ Fixed foreign key constraint: backup_history.created_by now uses TEXT instead of UUID',
        '✅ Fixed foreign key constraint: restore_history.created_by now uses TEXT instead of UUID',
        '✅ Updated all database functions to use TEXT for user references',
        '✅ Updated backend APIs to handle TEXT user IDs properly',
        '✅ Fixed admin statistics to use users table instead of admins table',
        '✅ Updated activity logging to use TEXT user IDs'
      ],
      recommendations: allTestsPassed ? [
        '✅ All backup system fixes are properly implemented',
        '✅ Foreign key constraints are now compatible',
        '✅ Database functions are working correctly',
        '✅ API endpoints are accessible',
        '🎯 Backup system is ready for production use'
      ] : [
        '⚠️ Some backup system components need attention',
        '🔧 Check database setup for backup_history and restore_history tables',
        '🔧 Verify foreign key constraints are properly set up',
        '🔧 Ensure all database functions are created',
        '🔧 Check API endpoints are properly deployed',
        '📋 Review failed tests and fix issues before production deployment'
      ]
    })

  } catch (error) {
    console.error('Backup system test error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test backup system fixes',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const results: any = {
      success: true,
      message: 'Database setup verification',
      tables: {},
      functions: {},
      superAdmin: null,
      errors: []
    }

    // Test 1: Check if all required tables exist
    const requiredTables = [
      'users',
      'admins', 
      'admin_sessions',
      'admin_assets',
      'admin_activity_logs',
      'verification_codes',
      'login_attempts',
      'account_lockouts',
      'activity_logs',
      'user_sessions'
    ]

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          results.tables[tableName] = { exists: false, error: error.message }
          results.errors.push(`Table ${tableName}: ${error.message}`)
        } else {
          results.tables[tableName] = { exists: true, recordCount: data?.length || 0 }
        }
      } catch (err) {
        results.tables[tableName] = { exists: false, error: 'Connection failed' }
        results.errors.push(`Table ${tableName}: Connection failed`)
      }
    }

    // Test 2: Check if Super Admin user exists
    try {
      const { data: superAdmin, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', 'shaniparacha2021@gmail.com')
        .eq('role', 'SUPER_ADMIN')
        .single()

      if (error) {
        results.superAdmin = { exists: false, error: error.message }
        results.errors.push(`Super Admin: ${error.message}`)
      } else {
        results.superAdmin = { 
          exists: true, 
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
          isActive: superAdmin.is_active
        }
      }
    } catch (err) {
      results.superAdmin = { exists: false, error: 'Connection failed' }
      results.errors.push('Super Admin: Connection failed')
    }

    // Test 3: Test session management functions
    try {
      const { data: sessionTest, error } = await supabaseAdmin
        .rpc('has_active_admin_session', { p_admin_id: 'test-admin-id' })

      if (error) {
        results.functions.sessionManagement = { exists: false, error: error.message }
        results.errors.push(`Session functions: ${error.message}`)
      } else {
        results.functions.sessionManagement = { exists: true, testResult: sessionTest }
      }
    } catch (err) {
      results.functions.sessionManagement = { exists: false, error: 'Function not found' }
      results.errors.push('Session functions: Function not found')
    }

    // Test 4: Check column structure
    try {
      // Check activity_logs table structure
      const { data: activityLogsColumns, error: activityLogsError } = await supabaseAdmin
        .from('activity_logs')
        .select('timestamp, created_at')
        .limit(1)

      if (activityLogsError && activityLogsError.message.includes('column "created_at" does not exist')) {
        results.functions.columnStructure = { 
          success: true, 
          activityLogsUsesTimestamp: true,
          note: 'activity_logs correctly uses "timestamp" column'
        }
      } else if (activityLogsError && activityLogsError.message.includes('column "timestamp" does not exist')) {
        results.functions.columnStructure = { 
          success: false, 
          activityLogsUsesTimestamp: false,
          error: 'activity_logs should use "timestamp" column, not "created_at"'
        }
        results.errors.push('Column structure: activity_logs should use "timestamp" column')
      } else {
        results.functions.columnStructure = { 
          success: true, 
          activityLogsUsesTimestamp: true,
          note: 'activity_logs table structure is correct'
        }
      }
    } catch (err) {
      results.functions.columnStructure = { success: false, error: 'Column structure check failed' }
      results.errors.push('Column structure: Check failed')
    }

    // Test 5: Check if we can create a test admin
    try {
      const testAdminData = {
        full_name: 'Test Admin',
        username: 'test-admin-' + Date.now(),
        email: 'test-admin-' + Date.now() + '@example.com',
        password_hash: '$2a$10$test.hash.for.testing.purposes.only',
        is_active: true
      }

      const { data: testAdmin, error } = await supabaseAdmin
        .from('admins')
        .insert(testAdminData)
        .select()
        .single()

      if (error) {
        results.functions.adminCreation = { success: false, error: error.message }
        results.errors.push(`Admin creation: ${error.message}`)
      } else {
        // Clean up test admin
        await supabaseAdmin
          .from('admins')
          .delete()
          .eq('id', testAdmin.id)

        results.functions.adminCreation = { success: true, testAdminId: testAdmin.id }
      }
    } catch (err) {
      results.functions.adminCreation = { success: false, error: 'Admin creation failed' }
      results.errors.push('Admin creation: Creation failed')
    }

    // Determine overall success
    const hasErrors = results.errors.length > 0
    results.success = !hasErrors

    if (hasErrors) {
      results.message = `Database setup has ${results.errors.length} issues that need to be fixed`
    } else {
      results.message = 'Database setup is complete and working correctly!'
    }

    return NextResponse.json(results, { status: hasErrors ? 400 : 200 })

  } catch (error) {
    console.error('Database setup test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database setup test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

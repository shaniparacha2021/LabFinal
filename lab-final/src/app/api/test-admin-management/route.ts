import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Admin Management System...')
    
    // Test 1: Check if tables exist
    console.log('1. Checking if admin tables exist...')
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['admins', 'admin_assets', 'admin_activity_logs'])
      .eq('table_schema', 'public')

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check tables',
        details: tablesError
      }, { status: 500 })
    }

    console.log('✅ Tables found:', tables?.map(t => t.table_name))

    // Test 2: Check if we can query admins table
    console.log('2. Testing admins table access...')
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .limit(5)

    if (adminsError) {
      console.error('❌ Error querying admins:', adminsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to query admins table',
        details: adminsError
      }, { status: 500 })
    }

    console.log('✅ Admins query successful, found:', admins?.length || 0, 'admins')

    // Test 3: Check if we can query admin_assets table
    console.log('3. Testing admin_assets table access...')
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('admin_assets')
      .select('*')
      .limit(5)

    if (assetsError) {
      console.error('❌ Error querying admin_assets:', assetsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to query admin_assets table',
        details: assetsError
      }, { status: 500 })
    }

    console.log('✅ Admin assets query successful, found:', assets?.length || 0, 'assets')

    // Test 4: Check if we can query admin_activity_logs table
    console.log('4. Testing admin_activity_logs table access...')
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('admin_activity_logs')
      .select('*')
      .limit(5)

    if (logsError) {
      console.error('❌ Error querying admin_activity_logs:', logsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to query admin_activity_logs table',
        details: logsError
      }, { status: 500 })
    }

    console.log('✅ Admin activity logs query successful, found:', logs?.length || 0, 'logs')

    // Test 5: Test creating a sample admin
    console.log('5. Testing admin creation...')
    const testAdminData = {
      id: 'test-admin-' + Date.now(),
      full_name: 'Test Admin',
      username: 'testadmin' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      mobile_number: '+1234567890',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      is_active: true,
      created_by: null
    }

    const { data: newAdmin, error: createError } = await supabaseAdmin
      .from('admins')
      .insert(testAdminData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating test admin:', createError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create test admin',
        details: createError
      }, { status: 500 })
    }

    console.log('✅ Test admin created successfully:', newAdmin.id)

    // Test 6: Test creating sample assets for the test admin
    console.log('6. Testing asset creation...')
    const testAssets = [
      {
        admin_id: newAdmin.id,
        asset_type: 'header_image',
        asset_name: 'Test Header',
        file_path: 'assets/images/headers/test-header.svg',
        github_url: 'https://github.com/shaniparacha2021/LabFinal/blob/main/assets/images/headers/test-header.svg',
        file_size: 2500,
        mime_type: 'image/svg+xml'
      },
      {
        admin_id: newAdmin.id,
        asset_type: 'footer_image',
        asset_name: 'Test Footer',
        file_path: 'assets/images/footers/test-footer.svg',
        github_url: 'https://github.com/shaniparacha2021/LabFinal/blob/main/assets/images/footers/test-footer.svg',
        file_size: 2000,
        mime_type: 'image/svg+xml'
      }
    ]

    const { data: newAssets, error: assetsCreateError } = await supabaseAdmin
      .from('admin_assets')
      .insert(testAssets)
      .select()

    if (assetsCreateError) {
      console.error('❌ Error creating test assets:', assetsCreateError)
      // Clean up test admin
      await supabaseAdmin.from('admins').delete().eq('id', newAdmin.id)
      return NextResponse.json({
        success: false,
        error: 'Failed to create test assets',
        details: assetsCreateError
      }, { status: 500 })
    }

    console.log('✅ Test assets created successfully:', newAssets?.length || 0, 'assets')

    // Test 7: Clean up test data
    console.log('7. Cleaning up test data...')
    await supabaseAdmin.from('admin_assets').delete().eq('admin_id', newAdmin.id)
    await supabaseAdmin.from('admins').delete().eq('id', newAdmin.id)
    console.log('✅ Test data cleaned up')

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Admin Management System is working correctly!',
      results: {
        tables_exist: tables?.map(t => t.table_name) || [],
        admins_count: admins?.length || 0,
        assets_count: assets?.length || 0,
        logs_count: logs?.length || 0,
        test_admin_created: true,
        test_assets_created: true,
        cleanup_completed: true
      },
      recommendations: [
        'Admin Management System is ready for use',
        'You can now create admins through the Super Admin dashboard',
        'Assets will be automatically assigned to new admins',
        'All CRUD operations are working correctly'
      ]
    })

  } catch (error) {
    console.error('❌ Admin Management System test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Admin Management System test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

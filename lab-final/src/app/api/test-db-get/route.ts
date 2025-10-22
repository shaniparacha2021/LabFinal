import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_active')
      .limit(5)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        message: 'Database connection failed. Check your Supabase configuration.'
      }, { status: 500 })
    }

    // Check for Super Admin user
    const superAdmin = users?.find(user => user.email === 'shaniparacha2021@gmail.com')

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      database_info: {
        total_users: users?.length || 0,
        users: users?.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active
        })) || []
      },
      super_admin_status: {
        exists: !!superAdmin,
        details: superAdmin ? {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
          is_active: superAdmin.is_active
        } : null
      },
      instructions: {
        if_no_super_admin: 'Run /api/setup-user-get to create the Super Admin user',
        if_super_admin_exists: 'Run /api/debug-auth-get to test authentication'
      }
    })

  } catch (error) {
    console.error('Test DB error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to connect to database. Check your environment variables.'
    }, { status: 500 })
  }
}

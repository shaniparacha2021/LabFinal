import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Removing all admin users from database...')
    
    // Step 1: Get all admin users before deletion
    console.log('🔍 Getting current admin users...')
    const { data: adminUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('role', ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'])

    if (fetchError) {
      console.error('❌ Error fetching admin users:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch admin users',
        details: fetchError.message
      }, { status: 500 })
    }

    console.log(`👥 Found ${adminUsers?.length || 0} admin users to remove`)

    const removedUsers = adminUsers || []
    const adminUserIds = removedUsers.map(user => user.id)
    const adminEmails = removedUsers.map(user => user.email)

    // Step 2: Remove all related data
    console.log('🧹 Removing related data...')
    
    // Remove account lockouts
    const { error: lockoutError } = await supabaseAdmin
      .from('account_lockouts')
      .delete()
      .in('user_id', adminUserIds)

    if (lockoutError) {
      console.error('❌ Error removing account lockouts:', lockoutError)
    }

    // Remove login attempts
    const { error: attemptsError } = await supabaseAdmin
      .from('login_attempts')
      .delete()
      .in('email', adminEmails)

    if (attemptsError) {
      console.error('❌ Error removing login attempts:', attemptsError)
    }

    // Remove verification codes
    const { error: codesError } = await supabaseAdmin
      .from('verification_codes')
      .delete()
      .in('email', adminEmails)

    if (codesError) {
      console.error('❌ Error removing verification codes:', codesError)
    }

    // Remove activity logs
    const { error: logsError } = await supabaseAdmin
      .from('activity_logs')
      .delete()
      .in('email', adminEmails)

    if (logsError) {
      console.error('❌ Error removing activity logs:', logsError)
    }

    // Remove user sessions
    const { error: sessionsError } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .in('user_id', adminUserIds)

    if (sessionsError) {
      console.error('❌ Error removing user sessions:', sessionsError)
    }

    // Step 3: Remove all admin users
    console.log('👤 Removing admin users...')
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .in('role', ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'])

    if (deleteError) {
      console.error('❌ Error removing admin users:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to remove admin users',
        details: deleteError.message
      }, { status: 500 })
    }

    // Step 4: Verify removal
    console.log('🔍 Verifying removal...')
    const { data: remainingAdmins, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('role', ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'])

    if (verifyError) {
      console.error('❌ Error verifying removal:', verifyError)
    }

    // Step 5: Get current user roles
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('role')

    const roleCounts = allUsers?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    console.log('✅ Admin users removal completed')

    return NextResponse.json({
      success: true,
      message: 'All admin users removed successfully',
      removed_users: removedUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      })),
      removal_summary: {
        total_admins_removed: removedUsers.length,
        remaining_admins: remainingAdmins?.length || 0,
        cleanup_actions: [
          'Removed account lockouts',
          'Removed login attempts',
          'Removed verification codes',
          'Removed activity logs',
          'Removed user sessions',
          'Removed admin users'
        ]
      },
      current_user_roles: roleCounts,
      next_steps: [
        '✅ All admin users have been removed',
        '🧹 All related data has been cleaned up',
        '🆕 Database is ready for new admin creation',
        '🔐 You can now create a new user via Supabase authentication',
        '📝 After creating the user, you can update their role and password'
      ]
    })

  } catch (error) {
    console.error('❌ Remove all admins error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking current admin users...')
    
    // Get current admin users
    const { data: adminUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('role', ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'])

    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch admin users',
        details: fetchError.message
      }, { status: 500 })
    }

    // Get all user roles
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('role')

    const roleCounts = allUsers?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      message: 'Current admin users status',
      admin_users: adminUsers?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      })) || [],
      user_role_counts: roleCounts,
      total_admins: adminUsers?.length || 0,
      recommendation: (adminUsers?.length || 0) > 0 ? 
        'Run POST /api/remove-all-admins to remove all admin users' :
        'No admin users found - database is clean'
    })

  } catch (error) {
    console.error('❌ Check admin users error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

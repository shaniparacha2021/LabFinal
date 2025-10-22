import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('super-admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No authentication token' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    // Verify user is Super Admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .eq('role', 'SUPER_ADMIN')
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Get dashboard statistics
    const [
      totalUsers,
      totalLoginAttempts,
      recentActivity,
      activeSessions,
      failedLoginsToday,
      accountLockouts
    ] = await Promise.all([
      // Total users count
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('is_active', true),

      // Total login attempts (last 30 days)
      supabase
        .from('login_attempts')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Recent activity (last 7 days)
      supabase
        .from('activity_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(10),

      // Active sessions
      supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString()),

      // Failed logins today
      supabase
        .from('login_attempts')
        .select('id', { count: 'exact' })
        .eq('success', false)
        .gte('created_at', new Date().toISOString().split('T')[0]),

      // Active account lockouts
      supabase
        .from('account_lockouts')
        .select('*')
        .eq('is_active', true)
        .gt('lockout_until', new Date().toISOString())
    ])

    // Calculate login success rate
    const { data: successfulLogins, count: successfulCount } = await supabase
      .from('login_attempts')
      .select('id', { count: 'exact' })
      .eq('success', true)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const totalLogins = (totalLoginAttempts.count || 0) + (successfulCount || 0)
    const successRate = totalLogins > 0 ? ((successfulCount || 0) / totalLogins) * 100 : 0

    // Get user role distribution
    const { data: roleDistribution } = await supabase
      .from('users')
      .select('role')
      .eq('is_active', true)

    const roleStats = roleDistribution?.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {}) || {}

    // Get activity by action type
    const activityStats = recentActivity.data?.reduce((acc: any, activity: any) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers.count || 0,
        totalLoginAttempts: totalLoginAttempts.count || 0,
        successfulLogins: successfulCount || 0,
        failedLoginsToday: failedLoginsToday.count || 0,
        loginSuccessRate: Math.round(successRate * 100) / 100,
        activeSessions: activeSessions.data?.length || 0,
        activeLockouts: accountLockouts.data?.length || 0,
        roleDistribution: roleStats,
        activityStats: activityStats
      },
      recentActivity: recentActivity.data || [],
      activeSessions: activeSessions.data || [],
      accountLockouts: accountLockouts.data || []
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

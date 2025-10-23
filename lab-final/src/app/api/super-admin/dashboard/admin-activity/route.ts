import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

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

    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Fetch admin activity data
    const [
      loginStats,
      activityLogs,
      recentActivity
    ] = await Promise.all([
      // Get login statistics
      supabaseAdmin
        .from('user_sessions')
        .select('created_at, admin_id'),
      
      // Get activity logs
      supabaseAdmin
        .from('admin_activity_logs')
        .select('action, created_at, admin_id'),
      
      // Get recent admin activity (last 7 days)
      supabaseAdmin
        .from('admin_activity_logs')
        .select('admin_id, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Calculate total logins
    const totalLogins = loginStats.data?.length || 0

    // Calculate active today (logins in last 24 hours)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeToday = loginStats.data?.filter(session => 
      new Date(session.created_at) >= today
    ).length || 0

    // Calculate new this week (unique admins active in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const newThisWeek = new Set(
      recentActivity.data?.map(activity => activity.admin_id)
    ).size || 0

    // Calculate top actions
    const actionCounts: { [key: string]: number } = {}
    activityLogs.data?.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const activity = {
      totalLogins,
      activeToday,
      newThisWeek,
      topActions
    }

    return NextResponse.json({
      success: true,
      activity
    })

  } catch (error) {
    console.error('Admin activity error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

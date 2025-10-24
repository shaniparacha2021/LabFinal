import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// POST /api/super-admin/subscriptions/check-expired - Check and update expired subscriptions
export async function POST(request: NextRequest) {
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
    const { data: user, error: userError } = await supabaseAdmin
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

    // Call the database function to check expired subscriptions
    const { data: expiredCount, error: checkError } = await supabaseAdmin
      .rpc('check_expired_subscriptions')

    if (checkError) {
      console.error('Check expired subscriptions error:', checkError)
      return NextResponse.json(
        { message: 'Failed to check expired subscriptions' },
        { status: 500 }
      )
    }

    // Get list of expired subscriptions for reporting
    const { data: expiredSubscriptions } = await supabaseAdmin
      .from('admin_subscriptions')
      .select(`
        id,
        admin_id,
        plan_type,
        expiry_date,
        admins!inner(
          id,
          full_name,
          email
        )
      `)
      .eq('status', 'EXPIRED')
      .lt('expiry_date', new Date().toISOString())

    // Create notifications for expired subscriptions
    if (expiredSubscriptions && expiredSubscriptions.length > 0) {
      const notifications = expiredSubscriptions.map(subscription => ({
        admin_id: subscription.admin_id,
        subscription_id: subscription.id,
        notification_type: 'SUBSCRIPTION_EXPIRED',
        title: 'Subscription Expired',
        message: `Your ${subscription.plan_type.toLowerCase()} subscription has expired. Please renew to continue using the service.`,
        action_url: '/admin/subscription'
      }))

      await supabaseAdmin
        .from('subscription_notifications')
        .insert(notifications)
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: decoded.userId, // Super admin as admin
        action: 'EXPIRED_SUBSCRIPTIONS_CHECKED',
        details: {
          expired_count: expiredCount,
          expired_subscriptions: expiredSubscriptions?.map(s => s.id) || []
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    return NextResponse.json({
      message: 'Expired subscriptions checked successfully',
      expiredCount: expiredCount || 0,
      expiredSubscriptions: expiredSubscriptions || []
    })

  } catch (error) {
    console.error('Check expired subscriptions error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Fetch comprehensive dashboard statistics
    const [
      adminStats,
      subscriptionStats,
      revenueStats,
      notificationStats,
      backupStats
    ] = await Promise.all([
      // Admin Statistics
      supabaseAdmin
        .from('users')
        .select('id, is_active, role', { count: 'exact' })
        .eq('role', 'ADMIN'),
      
      // Subscription Statistics
      supabaseAdmin
        .from('admin_subscriptions')
        .select('id, status, plan_type', { count: 'exact' }),
      
      // Revenue Statistics
      supabaseAdmin
        .from('subscription_payments')
        .select('amount, payment_status, created_at'),
      
      // Notification Statistics
      supabaseAdmin
        .from('direct_notifications')
        .select('id, created_at', { count: 'exact' }),
      
      // Backup Statistics
      supabaseAdmin
        .from('backup_history')
        .select('id, created_at, status', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(1)
    ])

    // Process admin statistics
    const totalAdmins = adminStats.count || 0
    const activeAdmins = adminStats.data?.filter(admin => admin.is_active).length || 0
    const suspendedAdmins = adminStats.data?.filter(admin => !admin.is_active).length || 0

    // Process subscription statistics
    const totalSubscriptions = subscriptionStats.count || 0
    const activeSubscriptions = subscriptionStats.data?.filter(sub => sub.status === 'ACTIVE').length || 0
    const expiredSubscriptions = subscriptionStats.data?.filter(sub => sub.status === 'EXPIRED').length || 0

    // Process revenue statistics
    const totalRevenue = revenueStats.data?.reduce((sum, payment) => {
      if (payment.payment_status === 'PAID') {
        return sum + (payment.amount || 0)
      }
      return sum
    }, 0) || 0

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyRevenue = revenueStats.data?.reduce((sum, payment) => {
      const paymentDate = new Date(payment.created_at)
      if (
        payment.payment_status === 'PAID' &&
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      ) {
        return sum + (payment.amount || 0)
      }
      return sum
    }, 0) || 0

    // Process notification statistics
    const totalNotifications = notificationStats.count || 0
    
    // Get unread notifications count
    const { count: unreadCount } = await supabaseAdmin
      .from('notification_recipients')
      .select('id', { count: 'exact' })
      .eq('delivery_status', 'DELIVERED')
      .is('read_at', null)

    // Process backup statistics
    const totalBackups = backupStats.count || 0
    const lastBackupDate = backupStats.data?.[0]?.created_at || null

    const stats = {
      totalAdmins,
      activeAdmins,
      suspendedAdmins,
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      totalRevenue,
      monthlyRevenue,
      totalNotifications,
      unreadNotifications: unreadCount || 0,
      totalBackups,
      lastBackupDate
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Enhanced stats error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

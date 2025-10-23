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

    // Fetch subscription analytics data
    const [
      subscriptionPlans,
      subscriptionStatuses,
      paymentData
    ] = await Promise.all([
      // Get subscription plans breakdown
      supabaseAdmin
        .from('admin_subscriptions')
        .select('plan_type, amount')
        .eq('status', 'ACTIVE'),
      
      // Get subscription status breakdown
      supabaseAdmin
        .from('admin_subscriptions')
        .select('status'),
      
      // Get payment data for revenue calculation
      supabaseAdmin
        .from('subscription_payments')
        .select('amount, payment_status, admin_subscription_id')
        .eq('payment_status', 'PAID')
    ])

    // Process plan type analytics
    const byPlan = {
      trial: 0,
      monthly: 0,
      annual: 0,
      lifetime: 0
    }

    subscriptionPlans.data?.forEach(sub => {
      switch (sub.plan_type) {
        case 'TRIAL':
          byPlan.trial++
          break
        case 'MONTHLY':
          byPlan.monthly++
          break
        case 'ANNUAL':
          byPlan.annual++
          break
        case 'LIFETIME':
          byPlan.lifetime++
          break
      }
    })

    // Process status analytics
    const byStatus = {
      active: 0,
      expired: 0,
      pending: 0
    }

    subscriptionStatuses.data?.forEach(sub => {
      switch (sub.status) {
        case 'ACTIVE':
          byStatus.active++
          break
        case 'EXPIRED':
          byStatus.expired++
          break
        case 'PENDING':
          byStatus.pending++
          break
      }
    })

    // Process revenue by plan type
    const revenueByPlan = {
      trial: 0,
      monthly: 0,
      annual: 0,
      lifetime: 0
    }

    // Get subscription details for revenue calculation
    const { data: subscriptionDetails } = await supabaseAdmin
      .from('admin_subscriptions')
      .select('id, plan_type')

    // Calculate revenue by plan type
    paymentData.data?.forEach(payment => {
      const subscription = subscriptionDetails?.find(sub => sub.id === payment.admin_subscription_id)
      if (subscription) {
        const amount = payment.amount || 0
        switch (subscription.plan_type) {
          case 'TRIAL':
            revenueByPlan.trial += amount
            break
          case 'MONTHLY':
            revenueByPlan.monthly += amount
            break
          case 'ANNUAL':
            revenueByPlan.annual += amount
            break
          case 'LIFETIME':
            revenueByPlan.lifetime += amount
            break
        }
      }
    })

    const analytics = {
      byPlan,
      byStatus,
      revenueByPlan
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Subscription analytics error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

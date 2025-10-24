import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// GET /api/super-admin/subscriptions - List all subscriptions
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const planType = searchParams.get('planType')
    const adminId = searchParams.get('adminId')

    // Build query with joins
    let query = supabaseAdmin
      .from('admin_subscriptions')
      .select(`
        *,
        admins!inner(
          id,
          full_name,
          username,
          email,
          mobile_number,
          is_active
        ),
        subscription_plans!inner(
          id,
          plan_name,
          display_name,
          price_pkr,
          duration_days
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (planType) {
      query = query.eq('plan_type', planType)
    }

    if (adminId) {
      query = query.eq('admin_id', adminId)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: subscriptions, error: subscriptionsError, count } = await query

    if (subscriptionsError) {
      console.error('Subscriptions error:', subscriptionsError)
      return NextResponse.json(
        { message: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    // Get subscription statistics
    const { data: stats } = await supabaseAdmin
      .from('admin_subscriptions')
      .select('status, plan_type, payment_status')

    const subscriptionStats = {
      total: stats?.length || 0,
      active: stats?.filter(s => s.status === 'ACTIVE').length || 0,
      expired: stats?.filter(s => s.status === 'EXPIRED').length || 0,
      pendingRenewal: stats?.filter(s => s.status === 'PENDING_RENEWAL').length || 0,
      byPlan: stats?.reduce((acc: any, s) => {
        acc[s.plan_type] = (acc[s.plan_type] || 0) + 1
        return acc
      }, {}) || {},
      byPaymentStatus: stats?.reduce((acc: any, s) => {
        acc[s.payment_status] = (acc[s.payment_status] || 0) + 1
        return acc
      }, {}) || {}
    }

    return NextResponse.json({
      subscriptions: subscriptions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: subscriptionStats
    })

  } catch (error) {
    console.error('Subscriptions error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/super-admin/subscriptions - Create new subscription
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

    const {
      adminId,
      planType,
      startDate,
      autoRenew = false,
      amountPaid = 0,
      transactionReference,
      paymentStatus = 'PENDING',
      notes
    } = await request.json()

    if (!adminId || !planType) {
      return NextResponse.json(
        { message: 'Admin ID and plan type are required' },
        { status: 400 }
      )
    }

    // Verify admin exists
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, full_name, email')
      .eq('id', adminId)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Check if admin already has an active subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('admin_subscriptions')
      .select('id, status')
      .eq('admin_id', adminId)
      .eq('status', 'ACTIVE')
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { message: 'Admin already has an active subscription' },
        { status: 400 }
      )
    }

    // Create subscription using the database function
    const { data: subscriptionId, error: createError } = await supabaseAdmin
      .rpc('create_admin_subscription', {
        p_admin_id: adminId,
        p_plan_type: planType,
        p_start_date: startDate || new Date().toISOString(),
        p_auto_renew: autoRenew,
        p_created_by: decoded.userId
      })

    if (createError) {
      console.error('Create subscription error:', createError)
      return NextResponse.json(
        { message: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    // Update payment details if provided
    if (amountPaid > 0 || transactionReference) {
      await supabaseAdmin
        .from('subscription_payments')
        .update({
          amount_pkr: amountPaid,
          payment_status: paymentStatus,
          transaction_reference: transactionReference,
          payment_date: paymentStatus === 'PAID' ? new Date().toISOString() : null
        })
        .eq('subscription_id', subscriptionId)
    }

    // Update subscription with additional details
    if (notes) {
      await supabaseAdmin
        .from('admin_subscriptions')
        .update({
          amount_paid_pkr: amountPaid,
          transaction_reference: transactionReference,
          payment_status: paymentStatus,
          payment_date: paymentStatus === 'PAID' ? new Date().toISOString() : null,
          notes: notes
        })
        .eq('id', subscriptionId)
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action: 'SUBSCRIPTION_CREATED',
        details: {
          subscription_id: subscriptionId,
          plan_type: planType,
          amount_paid: amountPaid,
          payment_status: paymentStatus
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Create notification for admin
    await supabaseAdmin
      .from('subscription_notifications')
      .insert({
        admin_id: adminId,
        subscription_id: subscriptionId,
        notification_type: 'SUBSCRIPTION_CREATED',
        title: 'New Subscription Created',
        message: `Your ${planType.toLowerCase()} subscription has been created successfully.`,
        action_url: '/admin/subscription'
      })

    return NextResponse.json({
      message: 'Subscription created successfully',
      subscriptionId: subscriptionId
    })

  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

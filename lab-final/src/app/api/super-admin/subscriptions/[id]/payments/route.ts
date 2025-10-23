import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// GET /api/super-admin/subscriptions/[id]/payments - Get payment history for subscription
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get payment history for subscription
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('subscription_payments')
      .select(`
        *,
        admins!inner(
          id,
          full_name,
          email
        )
      `)
      .eq('subscription_id', params.id)
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('Payments error:', paymentsError)
      return NextResponse.json(
        { message: 'Failed to fetch payment history' },
        { status: 500 }
      )
    }

    // Calculate payment statistics
    const totalPaid = payments?.reduce((sum, payment) => {
      return payment.payment_status === 'PAID' ? sum + Number(payment.amount_pkr) : sum
    }, 0) || 0

    const totalPending = payments?.reduce((sum, payment) => {
      return payment.payment_status === 'PENDING' ? sum + Number(payment.amount_pkr) : sum
    }, 0) || 0

    const totalOverdue = payments?.reduce((sum, payment) => {
      return payment.payment_status === 'OVERDUE' ? sum + Number(payment.amount_pkr) : sum
    }, 0) || 0

    return NextResponse.json({
      payments: payments || [],
      statistics: {
        totalPaid,
        totalPending,
        totalOverdue,
        totalPayments: payments?.length || 0
      }
    })

  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/super-admin/subscriptions/[id]/payments - Add new payment record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      amountPkr,
      paymentStatus,
      transactionReference,
      paymentMethod,
      paymentDate,
      dueDate,
      notes
    } = await request.json()

    if (!amountPkr || !paymentStatus) {
      return NextResponse.json(
        { message: 'Amount and payment status are required' },
        { status: 400 }
      )
    }

    // Get subscription details
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('admin_subscriptions')
      .select('admin_id, plan_type')
      .eq('id', params.id)
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Create payment record
    const { data: newPayment, error: createError } = await supabaseAdmin
      .from('subscription_payments')
      .insert({
        subscription_id: params.id,
        admin_id: subscription.admin_id,
        amount_pkr: amountPkr,
        payment_status: paymentStatus,
        transaction_reference: transactionReference,
        payment_method: paymentMethod,
        payment_date: paymentDate || (paymentStatus === 'PAID' ? new Date().toISOString() : null),
        due_date: dueDate,
        notes: notes,
        created_by: decoded.userId
      })
      .select()
      .single()

    if (createError) {
      console.error('Create payment error:', createError)
      return NextResponse.json(
        { message: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    // Update subscription payment status if this is a successful payment
    if (paymentStatus === 'PAID') {
      await supabaseAdmin
        .from('admin_subscriptions')
        .update({
          payment_status: 'PAID',
          amount_paid_pkr: amountPkr,
          transaction_reference: transactionReference,
          payment_date: paymentDate || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: decoded.userId
        })
        .eq('id', params.id)
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: subscription.admin_id,
        action: 'PAYMENT_RECORDED',
        details: {
          subscription_id: params.id,
          payment_id: newPayment.id,
          amount_pkr: amountPkr,
          payment_status: paymentStatus,
          transaction_reference: transactionReference
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Create notification for admin
    await supabaseAdmin
      .from('subscription_notifications')
      .insert({
        admin_id: subscription.admin_id,
        subscription_id: params.id,
        notification_type: 'PAYMENT_RECORDED',
        title: 'Payment Recorded',
        message: `Payment of PKR ${amountPkr} has been recorded for your subscription.`,
        action_url: '/admin/subscription'
      })

    return NextResponse.json({
      message: 'Payment record created successfully',
      payment: newPayment
    })

  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// GET /api/super-admin/subscriptions/[id] - Get specific subscription
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

    // Get subscription with related data
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
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
          duration_days,
          features
        )
      `)
      .eq('id', params.id)
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Get payment history
    const { data: payments } = await supabaseAdmin
      .from('subscription_payments')
      .select('*')
      .eq('subscription_id', params.id)
      .order('created_at', { ascending: false })

    // Get reminders
    const { data: reminders } = await supabaseAdmin
      .from('subscription_reminders')
      .select('*')
      .eq('subscription_id', params.id)
      .order('reminder_date', { ascending: true })

    // Get notifications
    const { data: notifications } = await supabaseAdmin
      .from('subscription_notifications')
      .select('*')
      .eq('subscription_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      subscription,
      payments: payments || [],
      reminders: reminders || [],
      notifications: notifications || []
    })

  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/super-admin/subscriptions/[id] - Update subscription
export async function PUT(
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
      status,
      autoRenew,
      paymentStatus,
      amountPaid,
      transactionReference,
      notes,
      extensionDays
    } = await request.json()

    // Get current subscription
    const { data: currentSubscription, error: currentError } = await supabaseAdmin
      .from('admin_subscriptions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (currentError || !currentSubscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: decoded.userId
    }

    // Update status if provided
    if (status) {
      updateData.status = status
    }

    // Update auto renew if provided
    if (autoRenew !== undefined) {
      updateData.auto_renew = autoRenew
    }

    // Update payment details if provided
    if (paymentStatus) {
      updateData.payment_status = paymentStatus
    }

    if (amountPaid !== undefined) {
      updateData.amount_paid_pkr = amountPaid
    }

    if (transactionReference) {
      updateData.transaction_reference = transactionReference
    }

    if (paymentStatus === 'PAID') {
      updateData.payment_date = new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    // Update subscription
    const { error: updateError } = await supabaseAdmin
      .from('admin_subscriptions')
      .update(updateData)
      .eq('id', params.id)

    if (updateError) {
      console.error('Update subscription error:', updateError)
      return NextResponse.json(
        { message: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    // Extend subscription if requested
    if (extensionDays && extensionDays > 0) {
      const { error: extendError } = await supabaseAdmin
        .rpc('extend_subscription', {
          p_subscription_id: params.id,
          p_extension_days: extensionDays,
          p_updated_by: decoded.userId
        })

      if (extendError) {
        console.error('Extend subscription error:', extendError)
        return NextResponse.json(
          { message: 'Failed to extend subscription' },
          { status: 500 }
        )
      }
    }

    // Create payment record if payment details provided
    if (amountPaid > 0 || transactionReference) {
      await supabaseAdmin
        .from('subscription_payments')
        .insert({
          subscription_id: params.id,
          admin_id: currentSubscription.admin_id,
          amount_pkr: amountPaid || 0,
          payment_status: paymentStatus || 'PENDING',
          transaction_reference: transactionReference,
          payment_date: paymentStatus === 'PAID' ? new Date().toISOString() : null,
          created_by: decoded.userId
        })
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: currentSubscription.admin_id,
        action: 'SUBSCRIPTION_UPDATED',
        details: {
          subscription_id: params.id,
          changes: updateData,
          extension_days: extensionDays
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Create notification for admin
    await supabaseAdmin
      .from('subscription_notifications')
      .insert({
        admin_id: currentSubscription.admin_id,
        subscription_id: params.id,
        notification_type: 'SUBSCRIPTION_UPDATED',
        title: 'Subscription Updated',
        message: `Your subscription has been updated. Status: ${status || currentSubscription.status}`,
        action_url: '/admin/subscription'
      })

    return NextResponse.json({
      message: 'Subscription updated successfully'
    })

  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/super-admin/subscriptions/[id] - Cancel/Delete subscription
export async function DELETE(
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

    // Get current subscription
    const { data: currentSubscription, error: currentError } = await supabaseAdmin
      .from('admin_subscriptions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (currentError || !currentSubscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Cancel subscription (set status to CANCELLED)
    const { error: cancelError } = await supabaseAdmin
      .from('admin_subscriptions')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
        updated_by: decoded.userId
      })
      .eq('id', params.id)

    if (cancelError) {
      console.error('Cancel subscription error:', cancelError)
      return NextResponse.json(
        { message: 'Failed to cancel subscription' },
        { status: 500 }
      )
    }

    // Deactivate all reminders
    await supabaseAdmin
      .from('subscription_reminders')
      .update({ is_active: false })
      .eq('subscription_id', params.id)

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: currentSubscription.admin_id,
        action: 'SUBSCRIPTION_CANCELLED',
        details: {
          subscription_id: params.id,
          plan_type: currentSubscription.plan_type
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Create notification for admin
    await supabaseAdmin
      .from('subscription_notifications')
      .insert({
        admin_id: currentSubscription.admin_id,
        subscription_id: params.id,
        notification_type: 'SUBSCRIPTION_CANCELLED',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled by the administrator.',
        action_url: '/admin/subscription'
      })

    return NextResponse.json({
      message: 'Subscription cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

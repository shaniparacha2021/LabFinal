import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// GET /api/super-admin/subscription-plans - List all subscription plans
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

    // Get all subscription plans
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('price_pkr', { ascending: true })

    if (plansError) {
      console.error('Subscription plans error:', plansError)
      return NextResponse.json(
        { message: 'Failed to fetch subscription plans' },
        { status: 500 }
      )
    }

    // Get usage statistics for each plan
    const { data: usageStats } = await supabaseAdmin
      .from('admin_subscriptions')
      .select('plan_type, status')

    const planUsage = plans?.map(plan => {
      const planSubscriptions = usageStats?.filter(stat => stat.plan_type === plan.plan_name) || []
      return {
        ...plan,
        usage: {
          total: planSubscriptions.length,
          active: planSubscriptions.filter(s => s.status === 'ACTIVE').length,
          expired: planSubscriptions.filter(s => s.status === 'EXPIRED').length,
          pending: planSubscriptions.filter(s => s.status === 'PENDING_RENEWAL').length
        }
      }
    })

    return NextResponse.json({
      plans: planUsage || []
    })

  } catch (error) {
    console.error('Subscription plans error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/super-admin/subscription-plans - Create new subscription plan
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
      planName,
      displayName,
      description,
      pricePkr,
      durationDays,
      features
    } = await request.json()

    if (!planName || !displayName || pricePkr === undefined) {
      return NextResponse.json(
        { message: 'Plan name, display name, and price are required' },
        { status: 400 }
      )
    }

    // Check if plan name already exists
    const { data: existingPlan } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('plan_name', planName)
      .single()

    if (existingPlan) {
      return NextResponse.json(
        { message: 'Plan name already exists' },
        { status: 400 }
      )
    }

    // Create new subscription plan
    const { data: newPlan, error: createError } = await supabaseAdmin
      .from('subscription_plans')
      .insert({
        plan_name: planName,
        display_name: displayName,
        description: description,
        price_pkr: pricePkr,
        duration_days: durationDays || 0,
        features: features || {}
      })
      .select()
      .single()

    if (createError) {
      console.error('Create subscription plan error:', createError)
      return NextResponse.json(
        { message: 'Failed to create subscription plan' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: decoded.userId, // Super admin as admin
        action: 'SUBSCRIPTION_PLAN_CREATED',
        details: {
          plan_id: newPlan.id,
          plan_name: planName,
          price_pkr: pricePkr
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    return NextResponse.json({
      message: 'Subscription plan created successfully',
      plan: newPlan
    })

  } catch (error) {
    console.error('Create subscription plan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

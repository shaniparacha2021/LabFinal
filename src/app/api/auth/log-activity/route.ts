import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, action, ip } = await request.json()

    if (!email || !action) {
      return NextResponse.json(
        { message: 'Email and action are required' },
        { status: 400 }
      )
    }

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Log the activity
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        email: email,
        action: action,
        ip_address: ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging activity:', error)
      return NextResponse.json(
        { message: 'Failed to log activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Activity logged successfully'
    })

  } catch (error) {
    console.error('Log activity error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

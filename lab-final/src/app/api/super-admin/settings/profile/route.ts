import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
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

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, is_active, created_at, updated_at')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', decoded.userId)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email is already taken by another user' },
        { status: 400 }
      )
    }

    // Update user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({
        name: name,
        email: email,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId)
      .select('id, email, name, role, is_active, created_at, updated_at')
      .single()

    if (userError) {
      console.error('Update profile error:', userError)
      return NextResponse.json(
        { message: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Log profile update activity (using admin client to bypass RLS)
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: decoded.userId,
        email: user.email,
        action: 'PROFILE_UPDATED',
        ip_address: 'unknown',
        user_agent: 'unknown',
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

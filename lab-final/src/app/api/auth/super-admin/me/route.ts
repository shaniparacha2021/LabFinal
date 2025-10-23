import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase, supabaseAdmin } from '@/lib/supabase'
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

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    // Get user details from database (using admin client to bypass RLS)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, is_active, created_at, updated_at')
      .eq('id', decoded.userId)
      .eq('role', 'SUPER_ADMIN')
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user: {
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
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { message: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

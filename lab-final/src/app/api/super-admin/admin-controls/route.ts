import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/super-admin/admin-controls - List all admin account controls
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('admin_account_controls')
      .select(`
        *,
        admin:admins!inner(
          id, full_name, username, email, mobile_number, is_active, created_at
        )
      `, { count: 'exact' })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.or(`admin.full_name.ilike.%${search}%,admin.email.ilike.%${search}%,admin.username.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order('updated_at', { ascending: false })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: controls, error, count } = await query

    if (error) {
      console.error('Admin controls fetch error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch admin controls' },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: stats } = await supabaseAdmin
      .from('admin_account_controls')
      .select('status')
      .then(({ data }) => {
        const stats = {
          total: data?.length || 0,
          active: data?.filter(c => c.status === 'ACTIVE').length || 0,
          suspended: data?.filter(c => c.status === 'SUSPENDED').length || 0,
          inactive: data?.filter(c => c.status === 'INACTIVE').length || 0,
          pending_activation: data?.filter(c => c.status === 'PENDING_ACTIVATION').length || 0,
          deactivated: data?.filter(c => c.status === 'DEACTIVATED').length || 0
        }
        return { data: stats }
      })

    return NextResponse.json({
      success: true,
      data: controls,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Admin controls error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

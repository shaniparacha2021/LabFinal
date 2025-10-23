import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/admin/announcements/[id]/view - Mark announcement as viewed
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No authentication token' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const { viewType = 'BANNER' } = await request.json()

    // Mark announcement as viewed using database function
    const { data: success, error } = await supabaseAdmin
      .rpc('mark_announcement_viewed', {
        p_announcement_id: params.id,
        p_admin_id: decoded.userId,
        p_view_type: viewType
      })

    if (error) {
      console.error('Mark announcement viewed error:', error)
      return NextResponse.json(
        { message: 'Failed to mark announcement as viewed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement marked as viewed'
    })

  } catch (error) {
    console.error('Mark announcement viewed error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/admin/notifications/[id]/archive - Archive notification
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

    // Archive notification using database function
    const { data: success, error } = await supabaseAdmin
      .rpc('archive_notification', {
        p_notification_id: params.id,
        p_admin_id: decoded.userId
      })

    if (error) {
      console.error('Archive notification error:', error)
      return NextResponse.json(
        { message: 'Failed to archive notification' },
        { status: 500 }
      )
    }

    if (!success) {
      return NextResponse.json(
        { message: 'Notification not found or already archived' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification archived'
    })

  } catch (error) {
    console.error('Archive notification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

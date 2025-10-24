import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/admin/notifications/[id]/acknowledge - Acknowledge notification
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

    // Acknowledge notification using database function
    const { data: success, error } = await supabaseAdmin
      .rpc('acknowledge_notification', {
        p_notification_id: params.id,
        p_admin_id: decoded.userId
      })

    if (error) {
      console.error('Acknowledge notification error:', error)
      return NextResponse.json(
        { message: 'Failed to acknowledge notification' },
        { status: 500 }
      )
    }

    if (!success) {
      return NextResponse.json(
        { message: 'Notification not found or already acknowledged' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification acknowledged'
    })

  } catch (error) {
    console.error('Acknowledge notification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/super-admin/announcements/check-expired - Check and update expired announcements
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

    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Check and update expired announcements using database function
    const { data: expiredCount, error } = await supabaseAdmin
      .rpc('check_expired_announcements')

    if (error) {
      console.error('Check expired announcements error:', error)
      return NextResponse.json(
        { message: 'Failed to check expired announcements' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: decoded.userId,
        action: 'CHECK_EXPIRED_ANNOUNCEMENTS',
        details: `Checked expired announcements: ${expiredCount} announcements expired`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: `Successfully checked expired announcements`,
      data: {
        expiredCount: expiredCount || 0
      }
    })

  } catch (error) {
    console.error('Check expired announcements error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

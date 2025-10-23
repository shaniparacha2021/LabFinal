import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/admin/announcements - Get active announcements for admin
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const includeViewed = searchParams.get('includeViewed') === 'true'
    const includeDismissed = searchParams.get('includeDismissed') === 'true'

    // Get active announcements for this admin using database function
    const { data: announcements, error } = await supabaseAdmin
      .rpc('get_active_announcements_for_admin', {
        p_admin_id: decoded.userId
      })

    if (error) {
      console.error('Get active announcements error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch announcements' },
        { status: 500 }
      )
    }

    // Filter based on parameters
    let filteredAnnouncements = announcements || []

    if (!includeViewed) {
      filteredAnnouncements = filteredAnnouncements.filter(a => !a.is_viewed)
    }

    if (!includeDismissed) {
      filteredAnnouncements = filteredAnnouncements.filter(a => !a.is_dismissed)
    }

    // Get unread count
    const unreadCount = filteredAnnouncements.filter(a => !a.is_viewed && !a.is_dismissed).length

    // Get urgent announcements
    const urgentAnnouncements = filteredAnnouncements.filter(a => a.is_urgent && !a.is_dismissed)

    return NextResponse.json({
      success: true,
      data: {
        announcements: filteredAnnouncements,
        unreadCount,
        urgentCount: urgentAnnouncements.length,
        totalCount: filteredAnnouncements.length
      }
    })

  } catch (error) {
    console.error('Get admin announcements error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

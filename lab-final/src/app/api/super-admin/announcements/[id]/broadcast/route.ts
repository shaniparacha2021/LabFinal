import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/super-admin/announcements/[id]/broadcast - Broadcast announcement
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const {
      broadcastType = 'IMMEDIATE',
      scheduledAt
    } = await request.json()

    // Check if announcement exists and is active
    const { data: announcement, error: fetchError } = await supabaseAdmin
      .from('announcements')
      .select('id, title, status, announcement_type')
      .eq('id', params.id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      )
    }

    if (announcement.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Only active announcements can be broadcasted' },
        { status: 400 }
      )
    }

    // Check if already broadcasted
    const { data: existingBroadcast } = await supabaseAdmin
      .from('announcement_broadcasts')
      .select('id, status')
      .eq('announcement_id', params.id)
      .eq('status', 'COMPLETED')
      .single()

    if (existingBroadcast) {
      return NextResponse.json(
        { message: 'Announcement has already been broadcasted' },
        { status: 400 }
      )
    }

    // Broadcast announcement using database function
    const { data: broadcastId, error: broadcastError } = await supabaseAdmin
      .rpc('broadcast_announcement', {
        p_announcement_id: params.id,
        p_broadcast_type: broadcastType,
        p_scheduled_at: scheduledAt,
        p_created_by: decoded.userId
      })

    if (broadcastError) {
      console.error('Broadcast announcement error:', broadcastError)
      return NextResponse.json(
        { message: 'Failed to broadcast announcement' },
        { status: 500 }
      )
    }

    // Get broadcast details
    const { data: broadcast, error: broadcastFetchError } = await supabaseAdmin
      .from('announcement_broadcasts')
      .select(`
        *,
        announcement:announcements(title, announcement_type)
      `)
      .eq('id', broadcastId)
      .single()

    if (broadcastFetchError) {
      console.error('Fetch broadcast error:', broadcastFetchError)
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: decoded.userId,
        action: 'BROADCAST_ANNOUNCEMENT',
        details: `Broadcasted announcement: ${announcement.title} (${broadcastType})`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: broadcastType === 'IMMEDIATE' 
        ? 'Announcement broadcasted successfully' 
        : 'Announcement scheduled for broadcast',
      data: broadcast
    })

  } catch (error) {
    console.error('Broadcast announcement error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/super-admin/announcements/[id]/broadcast - Get broadcast status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: broadcasts, error } = await supabaseAdmin
      .from('announcement_broadcasts')
      .select(`
        *,
        announcement:announcements(title, announcement_type)
      `)
      .eq('announcement_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get broadcast status error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch broadcast status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: broadcasts
    })

  } catch (error) {
    console.error('Get broadcast status error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

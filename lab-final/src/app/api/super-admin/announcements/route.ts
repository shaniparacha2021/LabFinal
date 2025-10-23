import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/super-admin/announcements - List all announcements
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
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('announcements')
      .select(`
        *,
        created_by_user:users!announcements_created_by_fkey(name, email),
        updated_by_user:users!announcements_updated_by_fkey(name, email),
        broadcasts:announcement_broadcasts(id, status, total_recipients, successful_deliveries, broadcasted_at),
        view_count:announcement_views(count)
      `, { count: 'exact' })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (type) {
      query = query.eq('announcement_type', type)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: announcements, error, count } = await query

    if (error) {
      console.error('Announcements fetch error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch announcements' },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: stats } = await supabaseAdmin
      .from('announcements')
      .select('status, announcement_type')
      .then(({ data }) => {
        const stats = {
          total: data?.length || 0,
          active: data?.filter(a => a.status === 'ACTIVE').length || 0,
          draft: data?.filter(a => a.status === 'DRAFT').length || 0,
          archived: data?.filter(a => a.status === 'ARCHIVED').length || 0,
          expired: data?.filter(a => a.status === 'EXPIRED').length || 0,
          byType: {
            system_updates: data?.filter(a => a.announcement_type === 'SYSTEM_UPDATES').length || 0,
            maintenance_alerts: data?.filter(a => a.announcement_type === 'MAINTENANCE_ALERTS').length || 0,
            new_feature_releases: data?.filter(a => a.announcement_type === 'NEW_FEATURE_RELEASES').length || 0,
            subscription_offers: data?.filter(a => a.announcement_type === 'SUBSCRIPTION_OFFERS').length || 0,
            general_notices: data?.filter(a => a.announcement_type === 'GENERAL_NOTICES').length || 0
          }
        }
        return { data: stats }
      })

    return NextResponse.json({
      success: true,
      data: announcements,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Announcements error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/super-admin/announcements - Create new announcement
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

    const {
      title,
      description,
      announcementType,
      imageUrl,
      linkUrl,
      linkText,
      visibilityStartDate,
      visibilityEndDate,
      isUrgent = false,
      isPinned = false,
      notificationType = 'BANNER',
      targetAudience = ['ALL'],
      status = 'DRAFT',
      broadcastImmediately = false
    } = await request.json()

    if (!title || !announcementType) {
      return NextResponse.json(
        { message: 'Title and announcement type are required' },
        { status: 400 }
      )
    }

    // Create announcement using database function
    const { data: announcementId, error: createError } = await supabaseAdmin
      .rpc('create_announcement', {
        p_title: title,
        p_description: description,
        p_announcement_type: announcementType,
        p_image_url: imageUrl,
        p_link_url: linkUrl,
        p_link_text: linkText,
        p_visibility_start_date: visibilityStartDate || new Date().toISOString(),
        p_visibility_end_date: visibilityEndDate,
        p_is_urgent: isUrgent,
        p_is_pinned: isPinned,
        p_notification_type: notificationType,
        p_target_audience: targetAudience,
        p_created_by: decoded.userId
      })

    if (createError) {
      console.error('Create announcement error:', createError)
      return NextResponse.json(
        { message: 'Failed to create announcement' },
        { status: 500 }
      )
    }

    // Update status if not draft
    if (status !== 'DRAFT') {
      const { error: updateError } = await supabaseAdmin
        .from('announcements')
        .update({ 
          status,
          updated_by: decoded.userId
        })
        .eq('id', announcementId)

      if (updateError) {
        console.error('Update announcement status error:', updateError)
      }
    }

    // Broadcast immediately if requested
    if (broadcastImmediately && status === 'ACTIVE') {
      const { error: broadcastError } = await supabaseAdmin
        .rpc('broadcast_announcement', {
          p_announcement_id: announcementId,
          p_broadcast_type: 'IMMEDIATE',
          p_created_by: decoded.userId
        })

      if (broadcastError) {
        console.error('Broadcast announcement error:', broadcastError)
      }
    }

    // Get created announcement
    const { data: announcement, error: fetchError } = await supabaseAdmin
      .from('announcements')
      .select(`
        *,
        created_by_user:users!announcements_created_by_fkey(name, email),
        broadcasts:announcement_broadcasts(id, status, total_recipients, successful_deliveries, broadcasted_at)
      `)
      .eq('id', announcementId)
      .single()

    if (fetchError) {
      console.error('Fetch created announcement error:', fetchError)
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: decoded.userId,
        action: 'CREATE_ANNOUNCEMENT',
        details: `Created announcement: ${title}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    })

  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

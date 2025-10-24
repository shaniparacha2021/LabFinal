import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/super-admin/announcements/[id] - Get specific announcement
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

    const { data: announcement, error } = await supabaseAdmin
      .from('announcements')
      .select(`
        *,
        broadcasts:announcement_broadcasts(
          id, status, total_recipients, successful_deliveries, 
          failed_deliveries, broadcasted_at, scheduled_at, error_message
        ),
        views:announcement_views(
          id, admin_id, viewed_at, view_type, is_dismissed, dismissed_at
        ),
        notifications:announcement_notifications(
          id, admin_id, notification_type, is_read, is_dismissed,
          read_at, dismissed_at
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Get announcement error:', error)
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Get statistics
    const { data: stats } = await supabaseAdmin
      .from('announcement_views')
      .select('admin_id, is_dismissed')
      .eq('announcement_id', params.id)
      .then(({ data }) => {
        const totalViews = data?.length || 0
        const dismissedViews = data?.filter(v => v.is_dismissed).length || 0
        const uniqueViewers = new Set(data?.map(v => v.admin_id)).size
        
        return {
          data: {
            totalViews,
            uniqueViewers,
            dismissedViews,
            engagementRate: totalViews > 0 ? ((totalViews - dismissedViews) / totalViews * 100).toFixed(1) : 0
          }
        }
      })

    return NextResponse.json({
      success: true,
      data: {
        ...announcement,
        stats: stats
      }
    })

  } catch (error) {
    console.error('Get announcement error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/super-admin/announcements/[id] - Update announcement
export async function PUT(
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
      title,
      description,
      announcementType,
      imageUrl,
      linkUrl,
      linkText,
      visibilityStartDate,
      visibilityEndDate,
      isUrgent,
      isPinned,
      notificationType,
      targetAudience,
      status
    } = await request.json()

    // Check if announcement exists
    const { data: existingAnnouncement, error: fetchError } = await supabaseAdmin
      .from('announcements')
      .select('id, title, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingAnnouncement) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Update announcement
    const { data: updatedAnnouncement, error: updateError } = await supabaseAdmin
      .from('announcements')
      .update({
        title,
        description,
        announcement_type: announcementType,
        image_url: imageUrl,
        link_url: linkUrl,
        link_text: linkText,
        visibility_start_date: visibilityStartDate,
        visibility_end_date: visibilityEndDate,
        is_urgent: isUrgent,
        is_pinned: isPinned,
        notification_type: notificationType,
        target_audience: targetAudience,
        status,
        updated_by: decoded.userId
      })
      .select(`
        *,
        created_by_user:users!announcements_created_by_fkey(name, email),
        updated_by_user:users!announcements_updated_by_fkey(name, email)
      `)
      .eq('id', params.id)
      .single()

    if (updateError) {
      console.error('Update announcement error:', updateError)
      return NextResponse.json(
        { message: 'Failed to update announcement' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: decoded.userId,
        action: 'UPDATE_ANNOUNCEMENT',
        details: `Updated announcement: ${title}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement
    })

  } catch (error) {
    console.error('Update announcement error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/super-admin/announcements/[id] - Delete announcement
export async function DELETE(
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

    // Check if announcement exists
    const { data: existingAnnouncement, error: fetchError } = await supabaseAdmin
      .from('announcements')
      .select('id, title')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingAnnouncement) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Delete announcement (cascade will handle related records)
    const { error: deleteError } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Delete announcement error:', deleteError)
      return NextResponse.json(
        { message: 'Failed to delete announcement' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: decoded.userId,
        action: 'DELETE_ANNOUNCEMENT',
        details: `Deleted announcement: ${existingAnnouncement.title}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully'
    })

  } catch (error) {
    console.error('Delete announcement error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

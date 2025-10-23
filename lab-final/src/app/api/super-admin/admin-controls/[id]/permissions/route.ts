import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/super-admin/admin-controls/[id]/permissions - Get admin permissions
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

    // Get admin permissions
    const { data: control, error } = await supabaseAdmin
      .from('admin_account_controls')
      .select('permissions, permission_changes')
      .eq('admin_id', params.id)
      .single()

    if (error) {
      console.error('Get permissions error:', error)
      return NextResponse.json(
        { message: 'Failed to fetch permissions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      permissions: control?.permissions || {},
      permissionHistory: control?.permission_changes || []
    })

  } catch (error) {
    console.error('Get permissions error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/super-admin/admin-controls/[id]/permissions - Update admin permissions
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

    const { permissions } = await request.json()

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json(
        { message: 'Permissions object is required' },
        { status: 400 }
      )
    }

    // Update admin permissions using database function
    const { data: success, error } = await supabaseAdmin
      .rpc('update_admin_permissions', {
        p_admin_id: params.id,
        p_new_permissions: permissions,
        p_updated_by: decoded.userId
      })

    if (error) {
      console.error('Update permissions error:', error)
      return NextResponse.json(
        { message: 'Failed to update permissions' },
        { status: 500 }
      )
    }

    if (!success) {
      return NextResponse.json(
        { message: 'Admin account not found' },
        { status: 404 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: params.id,
        action: 'PERMISSIONS_UPDATED',
        details: {
          new_permissions: permissions,
          updated_by: decoded.userId
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Send notification to admin about permission changes
    await supabaseAdmin
      .rpc('send_direct_notification', {
        p_title: 'Permissions Updated',
        p_message: 'Your account permissions have been updated. Please review your new access levels.',
        p_notification_type: 'ACCOUNT_WARNING',
        p_priority: 'NORMAL',
        p_sender_id: decoded.userId,
        p_recipient_type: 'SPECIFIC',
        p_admin_ids: [params.id],
        p_action_url: '/admin/profile',
        p_action_button_text: 'View Profile',
        p_is_urgent: false,
        p_requires_acknowledgment: true
      })

    return NextResponse.json({
      success: true,
      message: 'Admin permissions updated successfully'
    })

  } catch (error) {
    console.error('Update permissions error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

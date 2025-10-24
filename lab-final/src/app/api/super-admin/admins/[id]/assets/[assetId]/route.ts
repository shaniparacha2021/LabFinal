import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Delete admin asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  try {
    // Verify Super Admin authentication
    const cookieStore = await cookies()
    const token = cookieStore.get('super-admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No authentication token' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    // Verify user is Super Admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .eq('role', 'SUPER_ADMIN')
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Check if asset exists and belongs to the admin
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('admin_assets')
      .select('*')
      .eq('id', params.assetId)
      .eq('admin_id', params.id)
      .single()

    if (assetError || !asset) {
      return NextResponse.json(
        { message: 'Asset not found' },
        { status: 404 }
      )
    }

    // Delete asset
    const { error: deleteError } = await supabaseAdmin
      .from('admin_assets')
      .delete()
      .eq('id', params.assetId)

    if (deleteError) {
      console.error('Error deleting admin asset:', deleteError)
      return NextResponse.json(
        { message: 'Failed to delete admin asset' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: params.id,
        action: 'ASSET_DELETED',
        details: {
          asset_type: asset.asset_type,
          asset_name: asset.asset_name,
          file_path: asset.file_path
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    return NextResponse.json({
      message: 'Asset deleted successfully'
    })

  } catch (error) {
    console.error('Delete admin asset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update asset status (activate/deactivate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  try {
    // Verify Super Admin authentication
    const cookieStore = await cookies()
    const token = cookieStore.get('super-admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No authentication token' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    // Verify user is Super Admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .eq('role', 'SUPER_ADMIN')
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const { is_active } = await request.json()

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { message: 'is_active must be a boolean value' },
        { status: 400 }
      )
    }

    // Check if asset exists and belongs to the admin
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('admin_assets')
      .select('*')
      .eq('id', params.assetId)
      .eq('admin_id', params.id)
      .single()

    if (assetError || !asset) {
      return NextResponse.json(
        { message: 'Asset not found' },
        { status: 404 }
      )
    }

    // Update asset status
    const { data: updatedAsset, error: updateError } = await supabaseAdmin
      .from('admin_assets')
      .update({ is_active })
      .eq('id', params.assetId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating asset status:', updateError)
      return NextResponse.json(
        { message: 'Failed to update asset status' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: params.id,
        action: is_active ? 'ASSET_ACTIVATED' : 'ASSET_DEACTIVATED',
        details: {
          asset_type: asset.asset_type,
          asset_name: asset.asset_name,
          previous_status: asset.is_active,
          new_status: is_active
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    return NextResponse.json({
      message: `Asset ${is_active ? 'activated' : 'deactivated'} successfully`,
      asset: updatedAsset
    })

  } catch (error) {
    console.error('Update asset status error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

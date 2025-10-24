import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Get admin assets
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if admin exists
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, full_name, username')
      .eq('id', params.id)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Get admin assets
    const { data: assets, error } = await supabaseAdmin
      .from('admin_assets')
      .select('*')
      .eq('admin_id', params.id)
      .order('asset_type', { ascending: true })

    if (error) {
      console.error('Error fetching admin assets:', error)
      return NextResponse.json(
        { message: 'Failed to fetch admin assets' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      admin,
      assets: assets || []
    })

  } catch (error) {
    console.error('Get admin assets error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Assign asset to admin
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { asset_type, asset_name, file_path, github_url, file_size, mime_type } = await request.json()

    // Validate required fields
    if (!asset_type || !asset_name || !file_path) {
      return NextResponse.json(
        { message: 'Asset type, name, and file path are required' },
        { status: 400 }
      )
    }

    // Validate asset type
    if (!['header_image', 'footer_image', 'watermark_image'].includes(asset_type)) {
      return NextResponse.json(
        { message: 'Invalid asset type. Must be header_image, footer_image, or watermark_image' },
        { status: 400 }
      )
    }

    // Check if admin exists
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, full_name, username')
      .eq('id', params.id)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Check if asset type already exists for this admin
    const { data: existingAsset } = await supabaseAdmin
      .from('admin_assets')
      .select('id')
      .eq('admin_id', params.id)
      .eq('asset_type', asset_type)
      .single()

    let assetData
    if (existingAsset) {
      // Update existing asset
      const { data: updatedAsset, error: updateError } = await supabaseAdmin
        .from('admin_assets')
        .update({
          asset_name,
          file_path,
          github_url,
          file_size,
          mime_type,
          is_active: true
        })
        .eq('id', existingAsset.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating admin asset:', updateError)
        return NextResponse.json(
          { message: 'Failed to update admin asset' },
          { status: 500 }
        )
      }

      assetData = updatedAsset
    } else {
      // Create new asset
      const { data: newAsset, error: createError } = await supabaseAdmin
        .from('admin_assets')
        .insert({
          admin_id: params.id,
          asset_type,
          asset_name,
          file_path,
          github_url,
          file_size,
          mime_type
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating admin asset:', createError)
        return NextResponse.json(
          { message: 'Failed to create admin asset' },
          { status: 500 }
        )
      }

      assetData = newAsset
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: params.id,
        action: existingAsset ? 'ASSET_UPDATED' : 'ASSET_ASSIGNED',
        details: {
          asset_type,
          asset_name,
          file_path,
          github_url
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    return NextResponse.json({
      message: existingAsset ? 'Asset updated successfully' : 'Asset assigned successfully',
      asset: assetData
    }, { status: existingAsset ? 200 : 201 })

  } catch (error) {
    console.error('Assign admin asset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

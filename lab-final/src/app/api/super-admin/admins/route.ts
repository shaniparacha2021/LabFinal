import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { generateAdminAssets } from '@/lib/asset-generator-simple'

// Get all admins
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Build query
    let query = supabaseAdmin
      .from('admins')
      .select(`
        *,
        created_by_user:users!admins_created_by_fkey(name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: admins, error, count } = await query

    if (error) {
      console.error('Error fetching admins:', error)
      return NextResponse.json(
        { message: 'Failed to fetch admins' },
        { status: 500 }
      )
    }

    // Remove password hashes from response
    const safeAdmins = admins?.map(admin => {
      const { password_hash, ...safeAdmin } = admin
      return safeAdmin
    }) || []

    return NextResponse.json({
      admins: safeAdmins,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get admins error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new admin
export async function POST(request: NextRequest) {
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

    const { full_name, username, email, mobile_number, password } = await request.json()

    // Validate required fields
    if (!full_name || !username || !email || !password) {
      return NextResponse.json(
        { message: 'Full name, username, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if username or email already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Create admin
    const { data: newAdmin, error } = await supabaseAdmin
      .from('admins')
      .insert({
        full_name,
        username,
        email,
        mobile_number,
        password_hash,
        created_by: decoded.userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin:', error)
      return NextResponse.json(
        { message: 'Failed to create admin' },
        { status: 500 }
      )
    }

    // Generate and assign default assets
    try {
      const generatedAssets = await generateAdminAssets({
        adminId: newAdmin.id,
        adminName: newAdmin.full_name,
        adminEmail: newAdmin.email,
        adminPhone: newAdmin.mobile_number
      })

      // Insert generated assets into database
      for (const asset of generatedAssets) {
        await supabaseAdmin
          .from('admin_assets')
          .insert({
            admin_id: newAdmin.id,
            asset_type: asset.asset_type,
            asset_name: asset.asset_name,
            file_path: asset.file_path,
            github_url: asset.github_url,
            file_size: asset.file_size,
            mime_type: asset.mime_type
          })
      }

      console.log(`✅ Generated ${generatedAssets.length} assets for admin ${newAdmin.id}`)
    } catch (assetError) {
      console.error('❌ Error generating assets:', assetError)
      // Continue with admin creation even if asset generation fails
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: newAdmin.id,
        action: 'ADMIN_CREATED',
        details: {
          full_name: newAdmin.full_name,
          username: newAdmin.username,
          email: newAdmin.email,
          assets_generated: true
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Remove password hash from response
    const { password_hash: _, ...safeAdmin } = newAdmin

    return NextResponse.json({
      message: 'Admin created successfully with default assets',
      admin: safeAdmin
    }, { status: 201 })

  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

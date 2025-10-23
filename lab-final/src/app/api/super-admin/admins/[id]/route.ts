import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Get specific admin
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

    // Get admin with assets
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select(`
        *,
        created_by_user:users!admins_created_by_fkey(name, email),
        assets:admin_assets(*)
      `)
      .eq('id', params.id)
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Remove password hash from response
    const { password_hash, ...safeAdmin } = admin

    return NextResponse.json({ admin: safeAdmin })

  } catch (error) {
    console.error('Get admin error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update admin
export async function PUT(
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

    const { full_name, username, email, mobile_number, password, is_active } = await request.json()

    // Check if admin exists
    const { data: existingAdmin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingAdmin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Check if username or email already exists (excluding current admin)
    if (username !== existingAdmin.username || email !== existingAdmin.email) {
      const { data: conflictAdmin } = await supabaseAdmin
        .from('admins')
        .select('id')
        .or(`username.eq.${username},email.eq.${email}`)
        .neq('id', params.id)
        .single()

      if (conflictAdmin) {
        return NextResponse.json(
          { message: 'Username or email already exists' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      full_name: full_name || existingAdmin.full_name,
      username: username || existingAdmin.username,
      email: email || existingAdmin.email,
      mobile_number: mobile_number || existingAdmin.mobile_number,
      is_active: is_active !== undefined ? is_active : existingAdmin.is_active
    }

    // Hash password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    // Update admin
    const { data: updatedAdmin, error } = await supabaseAdmin
      .from('admins')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating admin:', error)
      return NextResponse.json(
        { message: 'Failed to update admin' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: params.id,
        action: 'ADMIN_UPDATED',
        details: {
          changes: updateData,
          previous_data: {
            full_name: existingAdmin.full_name,
            username: existingAdmin.username,
            email: existingAdmin.email,
            is_active: existingAdmin.is_active
          }
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Remove password hash from response
    const { password_hash, ...safeAdmin } = updatedAdmin

    return NextResponse.json({
      message: 'Admin updated successfully',
      admin: safeAdmin
    })

  } catch (error) {
    console.error('Update admin error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete admin
export async function DELETE(
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
    const { data: existingAdmin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingAdmin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Delete admin (cascade will delete related assets and logs)
    const { error } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting admin:', error)
      return NextResponse.json(
        { message: 'Failed to delete admin' },
        { status: 500 }
      )
    }

    // Log activity
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: params.id,
        action: 'ADMIN_DELETED',
        details: {
          deleted_admin: {
            full_name: existingAdmin.full_name,
            username: existingAdmin.username,
            email: existingAdmin.email
          }
        },
        performed_by: decoded.userId,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    return NextResponse.json({
      message: 'Admin deleted successfully'
    })

  } catch (error) {
    console.error('Delete admin error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

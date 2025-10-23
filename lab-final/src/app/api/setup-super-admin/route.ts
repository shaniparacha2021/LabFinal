import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up Super Admin user...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10)
    console.log('✅ Password hashed successfully')
    
    // First, check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'shaniparacha2021@gmail.com')
      .single()

    if (existingUser) {
      console.log('👤 User already exists, updating password...')
      
      // Update existing user
      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          role: 'SUPER_ADMIN',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'shaniparacha2021@gmail.com')
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating user:', updateError)
        return NextResponse.json({
          success: false,
          error: updateError.message,
          details: updateError
        }, { status: 500 })
      }

      console.log('✅ User updated successfully:', user.email)
    } else {
      console.log('👤 Creating new Super Admin user...')
      
      // Create new user
      const { data: user, error: createError } = await supabase
        .from('users')
        .insert({
          id: 'super-admin-user',
          email: 'shaniparacha2021@gmail.com',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          password_hash: hashedPassword,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating user:', createError)
        return NextResponse.json({
          success: false,
          error: createError.message,
          details: createError
        }, { status: 500 })
      }

      console.log('✅ User created successfully:', user.email)
    }

    // Test password verification
    const testPassword = await bcrypt.compare('admin123', hashedPassword)
    console.log('🔐 Password verification test:', testPassword)

    // Test database query (same as login API)
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'shaniparacha2021@gmail.com')
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    if (testError || !testUser) {
      console.error('❌ Test query failed:', testError)
      return NextResponse.json({
        success: false,
        error: 'Test query failed',
        details: testError
      }, { status: 500 })
    }

    console.log('✅ Test query successful')

    return NextResponse.json({
      success: true,
      message: 'Super Admin user setup completed successfully',
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        is_active: testUser.is_active,
        password_verified: testPassword
      },
      next_steps: {
        message: 'You can now try logging in with the default credentials',
        credentials: {
          email: 'shaniparacha2021@gmail.com',
          password: 'admin123'
        }
      }
    })

  } catch (error) {
    console.error('❌ Setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Super Admin user status...')
    
    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'shaniparacha2021@gmail.com')
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Super Admin user not found',
        suggestion: 'Run POST /api/setup-super-admin to create the user'
      }, { status: 404 })
    }

    // Test the exact query used by login API
    const { data: loginTestUser, error: loginTestError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'shaniparacha2021@gmail.com')
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Super Admin user found',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        has_password_hash: !!user.password_hash
      },
      login_test: {
        success: !loginTestError && !!loginTestUser,
        error: loginTestError?.message,
        message: loginTestError ? 'Login API query would fail' : 'Login API query would succeed'
      }
    })

  } catch (error) {
    console.error('❌ Check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

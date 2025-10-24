import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Creating Super Admin user via GET request...')
    
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'
    
    // Generate password hash
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('Generated hash:', hashedPassword)
    
    // Delete any existing user first
    console.log('🧹 Deleting existing user...')
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', email)
    
    if (deleteError) {
      console.log('Delete error (might be expected):', deleteError.message)
    }
    
    // Create new user
    console.log('📝 Creating new user...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: 'super-admin-' + Date.now(),
        email: email,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        password_hash: hashedPassword,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ Error creating user:', userError)
      return NextResponse.json({
        success: false,
        error: userError.message,
        details: userError,
        code: userError.code
      }, { status: 500 })
    }

    console.log('✅ User created successfully:', user.email)

    // Test password verification
    const testPassword = await bcrypt.compare(password, user.password_hash)
    console.log('🔐 Password verification test:', testPassword)

    // Verify user exists
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Super Admin user created successfully!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      },
      verification: {
        password_test: testPassword,
        user_verification: !!verifyUser,
        verification_error: verifyError?.message
      },
      credentials: {
        email: email,
        password: password
      },
      instructions: {
        next_step: 'Now try logging in at /super-admin/login',
        credentials: 'Use the email and password shown above'
      }
    })

  } catch (error) {
    console.error('❌ Create user error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up Super Admin user...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // Create or update the Super Admin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        id: 'super-admin-user',
        email: 'shaniparacha2021@gmail.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        password_hash: hashedPassword,
        is_active: true
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json({
        success: false,
        error: userError.message,
        details: userError
      }, { status: 500 })
    }

    console.log('Super Admin user created/updated:', user.email)

    // Test password verification
    const testPassword = await bcrypt.compare('admin123', user.password_hash)
    console.log('Password verification test:', testPassword)

    return NextResponse.json({
      success: true,
      message: 'Super Admin user setup completed',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        password_verified: testPassword
      }
    })

  } catch (error) {
    console.error('Setup user error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

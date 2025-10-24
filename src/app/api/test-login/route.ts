import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('Testing login for:', email)

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      console.log('User not found or error:', userError)
      return NextResponse.json({
        success: false,
        message: 'User not found',
        error: userError?.message,
        debug: {
          email,
          userExists: !!user,
          userError: userError
        }
      }, { status: 404 })
    }

    console.log('User found:', user.email, 'Has password_hash:', !!user.password_hash)

    // Test password verification
    let isValidPassword = false
    
    if (user.password_hash) {
      isValidPassword = await bcrypt.compare(password, user.password_hash)
      console.log('Password verification result:', isValidPassword)
    } else {
      // Fallback for demo purposes
      isValidPassword = password === 'admin123'
      console.log('Using fallback password verification:', isValidPassword)
    }

    return NextResponse.json({
      success: isValidPassword,
      message: isValidPassword ? 'Login successful' : 'Invalid password',
      debug: {
        email,
        userExists: true,
        hasPasswordHash: !!user.password_hash,
        passwordValid: isValidPassword,
        userRole: user.role,
        userActive: user.is_active
      }
    })

  } catch (error) {
    console.error('Test login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

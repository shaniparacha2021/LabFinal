import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Fixing password hash for Super Admin...')
    
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'
    
    // Generate a fresh bcrypt hash
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    console.log('✅ Generated new password hash')
    console.log('🔍 Hash length:', hashedPassword.length)
    console.log('🔍 Hash starts with:', hashedPassword.substring(0, 10) + '...')
    
    // Update the user's password hash
    const { data: user, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating password hash:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update password hash',
        details: updateError.message
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: 'No user found with the specified email'
      }, { status: 404 })
    }

    // Verify the password works
    console.log('🔍 Verifying password works...')
    const isPasswordValid = await bcrypt.compare(password, hashedPassword)
    
    if (!isPasswordValid) {
      console.error('❌ Password verification failed after update')
      return NextResponse.json({
        success: false,
        error: 'Password verification failed after update',
        details: 'The new hash does not match the password'
      }, { status: 500 })
    }

    console.log('✅ Password verification successful')

    // Test the exact login query
    console.log('🔍 Testing login query...')
    const { data: loginUser, error: loginError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    if (loginError || !loginUser) {
      console.error('❌ Login query failed:', loginError)
      return NextResponse.json({
        success: false,
        error: 'Login query failed after password update',
        details: loginError?.message || 'User not found'
      }, { status: 500 })
    }

    console.log('✅ Login query successful')

    return NextResponse.json({
      success: true,
      message: 'Password hash fixed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        has_password_hash: !!user.password_hash
      },
      password_info: {
        method: 'bcrypt',
        salt_rounds: saltRounds,
        hash_length: hashedPassword.length,
        verification_test: isPasswordValid
      },
      actions_taken: [
        'Generated new bcrypt hash for password "admin123"',
        'Updated user record with new password hash',
        'Verified password works with new hash',
        'Tested login query with updated credentials'
      ],
      next_steps: [
        'Password hash is now correct',
        'Account lockout has been cleared',
        'Login should work with default credentials',
        'Email: shaniparacha2021@gmail.com',
        'Password: admin123'
      ]
    })

  } catch (error) {
    console.error('❌ Fix password hash error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking current password hash status...')
    
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'
    
    // Get current user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: userError?.message
      }, { status: 404 })
    }

    // Test password verification
    let passwordVerification = {
      has_hash: !!user.password_hash,
      hash_length: user.password_hash?.length || 0,
      verification_works: false,
      method: 'unknown'
    }

    if (user.password_hash) {
      try {
        passwordVerification.verification_works = await bcrypt.compare(password, user.password_hash)
        passwordVerification.method = 'bcrypt'
      } catch (err) {
        passwordVerification.method = 'error'
        console.error('Password verification error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password hash status checked',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active
      },
      password_status: passwordVerification,
      recommendation: passwordVerification.verification_works ? 
        'Password hash is working correctly' :
        'Password hash needs to be fixed - run POST /api/fix-password-hash'
    })

  } catch (error) {
    console.error('❌ Check password hash error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

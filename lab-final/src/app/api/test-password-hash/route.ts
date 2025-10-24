import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing password hash verification...')
    
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'
    
    // Get the user with password hash
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
    let passwordVerification = false
    let verificationMethod = 'none'
    let error = null

    if (user.password_hash) {
      try {
        passwordVerification = await bcrypt.compare(password, user.password_hash)
        verificationMethod = 'bcrypt'
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error'
        verificationMethod = 'error'
      }
    }

    // Test with a known working hash for comparison
    const knownWorkingHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    const knownHashTest = await bcrypt.compare(password, knownWorkingHash)

    return NextResponse.json({
      success: passwordVerification,
      message: passwordVerification ? 
        'Password hash verification successful!' : 
        'Password hash verification failed',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        has_password_hash: !!user.password_hash,
        password_hash_length: user.password_hash?.length || 0
      },
      password_tests: {
        current_hash_verification: passwordVerification,
        current_hash_method: verificationMethod,
        current_hash_error: error,
        known_hash_test: knownHashTest,
        current_hash: user.password_hash,
        known_working_hash: knownWorkingHash,
        hashes_match: user.password_hash === knownWorkingHash
      },
      diagnosis: {
        issue: passwordVerification ? 
          'Password verification works correctly' :
          'Password hash in database is incorrect',
        recommendation: passwordVerification ? 
          'Login should work now' :
          'Run the manual-password-fix.sql script in Supabase'
      },
      next_steps: passwordVerification ? [
        '✅ Password verification is working',
        '🚀 Try logging in with default credentials',
        'Email: shaniparacha2021@gmail.com',
        'Password: admin123'
      ] : [
        '❌ Password hash is incorrect',
        '🔧 Run manual-password-fix.sql in Supabase SQL Editor',
        '🔄 Then test login again'
      ]
    })

  } catch (error) {
    console.error('❌ Test password hash error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Password Hash Test Endpoint',
    description: 'Tests the current password hash verification',
    usage: 'POST /api/test-password-hash',
    purpose: 'Diagnoses password hash issues and provides specific recommendations'
  })
}

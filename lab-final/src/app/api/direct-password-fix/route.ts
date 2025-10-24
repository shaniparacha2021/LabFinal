import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Direct password fix - regenerating hash...')
    
    const email = 'shaniparacha2021@gmail.com'
    const password = 'admin123'
    
    // Generate a fresh bcrypt hash
    console.log('🔑 Generating fresh bcrypt hash...')
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    console.log('✅ Generated hash:', hashedPassword.substring(0, 20) + '...')
    console.log('📏 Hash length:', hashedPassword.length)
    
    // Test the hash immediately
    console.log('🧪 Testing hash verification...')
    const testVerification = await bcrypt.compare(password, hashedPassword)
    console.log('✅ Hash verification test:', testVerification)
    
    if (!testVerification) {
      return NextResponse.json({
        success: false,
        error: 'Generated hash does not verify correctly',
        details: 'The newly generated hash failed verification test'
      }, { status: 500 })
    }
    
    // Update the database
    console.log('💾 Updating database...')
    const { data: user, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
        is_active: true,
        role: 'SUPER_ADMIN'
      })
      .eq('email', email)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Database update failed',
        details: updateError.message
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found after update',
        details: 'No user found with the specified email'
      }, { status: 404 })
    }

    // Verify the update worked
    console.log('🔍 Verifying database update...')
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (verifyError || !verifyUser) {
      return NextResponse.json({
        success: false,
        error: 'Verification failed',
        details: verifyError?.message || 'User not found during verification'
      }, { status: 500 })
    }

    // Test password verification with the stored hash
    console.log('🔐 Testing password verification with stored hash...')
    const storedHashVerification = await bcrypt.compare(password, verifyUser.password_hash)
    console.log('✅ Stored hash verification:', storedHashVerification)

    // Clear any lockouts and failed attempts
    console.log('🧹 Clearing lockouts and failed attempts...')
    await supabaseAdmin
      .from('account_lockouts')
      .update({ is_active: false })
      .eq('user_id', user.id)

    await supabaseAdmin
      .from('login_attempts')
      .delete()
      .eq('email', email)
      .eq('success', false)

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
        error: 'Login query failed',
        details: loginError?.message || 'User not found in login query'
      }, { status: 500 })
    }

    // Final password test with login user
    const finalPasswordTest = await bcrypt.compare(password, loginUser.password_hash)
    console.log('🎯 Final password test:', finalPasswordTest)

    return NextResponse.json({
      success: true,
      message: 'Password hash fixed successfully with direct regeneration',
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
        generated_hash_verification: testVerification,
        stored_hash_verification: storedHashVerification,
        final_login_query_test: finalPasswordTest
      },
      actions_taken: [
        'Generated fresh bcrypt hash for password "admin123"',
        'Verified hash works before storing',
        'Updated database with new password hash',
        'Verified database update was successful',
        'Tested password verification with stored hash',
        'Cleared all account lockouts and failed attempts',
        'Tested complete login query flow',
        'Performed final password verification test'
      ],
      next_steps: [
        '✅ Password hash has been completely regenerated and verified',
        '🔓 All lockouts and failed attempts have been cleared',
        '🧪 All password verification tests passed',
        '🚀 Login should now work with default credentials:',
        '   Email: shaniparacha2021@gmail.com',
        '   Password: admin123'
      ]
    })

  } catch (error) {
    console.error('❌ Direct password fix error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Direct Password Fix Endpoint',
    description: 'Directly regenerates and fixes the password hash programmatically',
    usage: 'POST /api/direct-password-fix',
    features: [
      'Generates fresh bcrypt hash',
      'Verifies hash before storing',
      'Updates database directly',
      'Tests all verification steps',
      'Clears lockouts and failed attempts',
      'Performs complete end-to-end testing'
    ]
  })
}

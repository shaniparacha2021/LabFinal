import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('👤 Creating new Super Admin user...')
    
    const email = 'shaniparacha13@gmail.com'
    const password = 'Shani@123321...123'
    const name = 'Shani Paracha 13'
    const userId = 'super-admin-13'
    
    // Generate bcrypt hash for the password
    console.log('🔑 Generating password hash...')
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    console.log('✅ Password hash generated')
    console.log('📏 Hash length:', hashedPassword.length)
    
    // Test the hash immediately
    console.log('🧪 Testing password hash...')
    const testVerification = await bcrypt.compare(password, hashedPassword)
    console.log('✅ Hash verification test:', testVerification)
    
    if (!testVerification) {
      return NextResponse.json({
        success: false,
        error: 'Generated hash does not verify correctly',
        details: 'The newly generated hash failed verification test'
      }, { status: 500 })
    }
    
    // Check if user already exists
    console.log('🔍 Checking if user already exists...')
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      console.log('👤 User exists, updating...')
      
      // Update existing user
      const { data: user, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          name: name,
          role: 'SUPER_ADMIN',
          password_hash: hashedPassword,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Update error:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update existing user',
          details: updateError.message
        }, { status: 500 })
      }

      console.log('✅ User updated successfully')
    } else {
      console.log('👤 Creating new user...')
      
      // Create new user
      const { data: user, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: email,
          name: name,
          role: 'SUPER_ADMIN',
          password_hash: hashedPassword,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Create error:', createError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create new user',
          details: createError.message
        }, { status: 500 })
      }

      console.log('✅ User created successfully')
    }

    // Clear any existing lockouts and failed attempts
    console.log('🧹 Clearing related data...')
    await supabaseAdmin
      .from('account_lockouts')
      .update({ is_active: false })
      .eq('user_id', userId)

    await supabaseAdmin
      .from('login_attempts')
      .delete()
      .eq('email', email)

    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('email', email)

    await supabaseAdmin
      .from('activity_logs')
      .delete()
      .eq('email', email)

    await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)

    // Verify the user was created/updated correctly
    console.log('🔍 Verifying user...')
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (verifyError || !verifyUser) {
      return NextResponse.json({
        success: false,
        error: 'User verification failed',
        details: verifyError?.message || 'User not found after creation/update'
      }, { status: 500 })
    }

    // Test password verification with the stored hash
    console.log('🔐 Testing stored password hash...')
    const storedHashVerification = await bcrypt.compare(password, verifyUser.password_hash)
    console.log('✅ Stored hash verification:', storedHashVerification)

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

    // Final password test
    const finalPasswordTest = await bcrypt.compare(password, loginUser.password_hash)
    console.log('🎯 Final password test:', finalPasswordTest)

    return NextResponse.json({
      success: true,
      message: 'New Super Admin user created/updated successfully',
      user: {
        id: verifyUser.id,
        email: verifyUser.email,
        name: verifyUser.name,
        role: verifyUser.role,
        is_active: verifyUser.is_active,
        has_password_hash: !!verifyUser.password_hash,
        password_hash_length: verifyUser.password_hash?.length || 0,
        created_at: verifyUser.created_at,
        updated_at: verifyUser.updated_at
      },
      credentials: {
        email: email,
        password: password,
        role: 'SUPER_ADMIN'
      },
      password_tests: {
        generated_hash_verification: testVerification,
        stored_hash_verification: storedHashVerification,
        final_login_query_test: finalPasswordTest
      },
      actions_taken: [
        'Generated bcrypt hash for the new password',
        'Verified hash works before storing',
        existingUser ? 'Updated existing user' : 'Created new user',
        'Set role to SUPER_ADMIN',
        'Set user as active',
        'Cleared all related data (lockouts, attempts, etc.)',
        'Verified user creation/update was successful',
        'Tested password verification with stored hash',
        'Tested complete login query flow',
        'Performed final password verification test'
      ],
      next_steps: [
        '✅ New Super Admin user is ready',
        '🔑 Password hash has been generated and verified',
        '🧹 All related data has been cleared',
        '🚀 Login should work with new credentials:',
        `   Email: ${email}`,
        `   Password: ${password}`,
        '   Role: SUPER_ADMIN'
      ]
    })

  } catch (error) {
    console.error('❌ Create new super admin error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Create New Super Admin Endpoint',
    description: 'Creates or updates a new Super Admin user with specified credentials',
    usage: 'POST /api/create-new-super-admin',
    credentials: {
      email: 'shaniparacha13@gmail.com',
      password: 'Shani@123321...123',
      name: 'Shani Paracha 13',
      role: 'SUPER_ADMIN'
    },
    features: [
      'Creates new user or updates existing one',
      'Generates secure bcrypt password hash',
      'Sets SUPER_ADMIN role and active status',
      'Clears all related authentication data',
      'Performs comprehensive verification testing',
      'Provides detailed success/failure feedback'
    ]
  })
}

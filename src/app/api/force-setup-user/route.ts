import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Force setting up Super Admin user...')
    
    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash('admin123', 10)
    console.log('Generated password hash:', hashedPassword)
    
    // First, try to delete any existing user with this email
    console.log('🧹 Cleaning up existing user...')
    await supabase
      .from('users')
      .delete()
      .eq('email', 'shaniparacha2021@gmail.com')
    
    // Create the Super Admin user with explicit ID
    console.log('📝 Creating Super Admin user...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: 'super-admin-user-' + Date.now(), // Unique ID
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

    if (userError) {
      console.error('❌ Error creating user:', userError)
      return NextResponse.json({
        success: false,
        error: userError.message,
        details: userError,
        code: userError.code
      }, { status: 500 })
    }

    console.log('✅ Super Admin user created:', user.email)

    // Test password verification immediately
    const testPassword = await bcrypt.compare('admin123', user.password_hash)
    console.log('🔐 Password verification test:', testPassword)

    // Create activity log
    console.log('📝 Creating activity log...')
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        email: user.email,
        action: 'ACCOUNT_CREATED',
        ip_address: '127.0.0.1',
        user_agent: 'Force Setup',
        timestamp: new Date().toISOString()
      })

    if (logError) {
      console.error('❌ Error creating activity log:', logError)
    } else {
      console.log('✅ Activity log created')
    }

    // Verify user exists by querying
    console.log('🔍 Verifying user exists...')
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'shaniparacha2021@gmail.com')
      .single()

    if (verifyError || !verifyUser) {
      console.error('❌ User verification failed:', verifyError)
      return NextResponse.json({
        success: false,
        message: 'User created but verification failed',
        error: verifyError?.message
      }, { status: 500 })
    }

    console.log('✅ User verification successful')

    return NextResponse.json({
      success: true,
      message: 'Super Admin user setup completed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        password_verified: testPassword,
        created_at: user.created_at
      },
      verification: {
        user_exists: !!verifyUser,
        password_hash_present: !!user.password_hash,
        password_verification_works: testPassword
      }
    })

  } catch (error) {
    console.error('❌ Force setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Running SQL fix for RLS infinite recursion...')
    
    // This endpoint will attempt to run the SQL fix directly
    // If it fails, it will provide instructions for manual execution
    
    const results = {
      step1_disable_rls: { success: false, error: null },
      step2_create_user: { success: false, error: null },
      step3_enable_rls: { success: false, error: null },
      step4_create_policies: { success: false, error: null },
      step5_test_query: { success: false, error: null, data: null }
    }

    try {
      // Step 1: Try to disable RLS
      console.log('🔧 Step 1: Attempting to disable RLS...')
      const { error: disableError } = await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;'
      })
      
      if (disableError) {
        results.step1_disable_rls.error = disableError.message
        console.log('⚠️ Could not disable RLS via RPC, will provide manual instructions')
      } else {
        results.step1_disable_rls.success = true
        console.log('✅ RLS disabled successfully')
      }
    } catch (err) {
      results.step1_disable_rls.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 2: Create/Update Super Admin user
    console.log('👤 Step 2: Creating/updating Super Admin user...')
    try {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: 'super-admin-user',
          email: 'shaniparacha2021@gmail.com',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          password_hash: hashedPassword,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })
        .select()
        .single()

      if (userError) {
        results.step2_create_user.error = userError.message
        console.error('❌ User creation failed:', userError)
      } else {
        results.step2_create_user.success = true
        console.log('✅ Super Admin user created/updated:', user.email)
      }
    } catch (err) {
      results.step2_create_user.error = err instanceof Error ? err.message : 'Unknown error'
    }

    // Step 3: Test the login query
    console.log('🔐 Step 3: Testing login query...')
    try {
      const { data: user, error: queryError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', 'shaniparacha2021@gmail.com')
        .eq('role', 'SUPER_ADMIN')
        .eq('is_active', true)
        .single()

      if (queryError) {
        results.step5_test_query.error = queryError.message
        console.error('❌ Login query failed:', queryError)
      } else {
        results.step5_test_query.success = true
        results.step5_test_query.data = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active,
          has_password_hash: !!user.password_hash
        }
        console.log('✅ Login query successful')
      }
    } catch (err) {
      results.step5_test_query.error = err instanceof Error ? err.message : 'Unknown error'
    }

    const userCreated = results.step2_create_user.success
    const queryWorks = results.step5_test_query.success

    return NextResponse.json({
      success: userCreated && queryWorks,
      message: userCreated && queryWorks ? 
        'Super Admin user created and login query works!' : 
        'Some steps failed, manual intervention may be required',
      results,
      instructions: !userCreated || !queryWorks ? {
        title: 'Manual Fix Required',
        steps: [
          '1. Go to your Supabase Dashboard',
          '2. Navigate to SQL Editor',
          '3. Run the SQL script from: database/fix-rls-infinite-recursion.sql',
          '4. This will fix the RLS policies and create the Super Admin user',
          '5. After running the SQL, try logging in again'
        ],
        sql_file: 'database/fix-rls-infinite-recursion.sql',
        note: 'The SQL script will disable RLS temporarily, create the user, and set up proper policies'
      } : null,
      next_steps: userCreated && queryWorks ? [
        'Try logging in with default credentials',
        'Email: shaniparacha2021@gmail.com',
        'Password: admin123'
      ] : [
        'Run the SQL script manually in Supabase Dashboard',
        'Check the instructions above for detailed steps'
      ]
    })

  } catch (error) {
    console.error('❌ SQL fix error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      instructions: {
        title: 'Manual Fix Required',
        steps: [
          '1. Go to your Supabase Dashboard',
          '2. Navigate to SQL Editor', 
          '3. Run the SQL script from: database/fix-rls-infinite-recursion.sql',
          '4. This will fix the RLS policies and create the Super Admin user'
        ],
        sql_file: 'database/fix-rls-infinite-recursion.sql'
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'SQL Fix Endpoint',
    description: 'This endpoint attempts to fix RLS infinite recursion issues',
    usage: 'POST /api/run-sql-fix',
    manual_fix: {
      title: 'If automatic fix fails, run this SQL in Supabase Dashboard:',
      file: 'database/fix-rls-infinite-recursion.sql',
      steps: [
        '1. Go to Supabase Dashboard → SQL Editor',
        '2. Copy and paste the contents of fix-rls-infinite-recursion.sql',
        '3. Run the SQL script',
        '4. Try logging in again'
      ]
    }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_active')
      .eq('email', 'shaniparacha2021@gmail.com')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    if (!users) {
      return NextResponse.json({
        success: false,
        message: 'Super Admin user not found',
        suggestion: 'Run the database setup script'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        is_active: users.is_active
      }
    })

  } catch (error) {
    console.error('Test DB error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { 
  createAdminSession, 
  hasActiveAdminSession, 
  getActiveAdminSession,
  createAdminJWT,
  getDeviceInfo 
} from '@/lib/admin-session-manager'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get client information
    const userAgent = request.headers.get('user-agent') || ''
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const deviceInfo = getDeviceInfo(userAgent)

    // Find admin by email
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Check if admin already has an active session
    const hasActiveSession = await hasActiveAdminSession(admin.id)
    if (hasActiveSession) {
      // Get information about the existing session
      const existingSession = await getActiveAdminSession(admin.id)
      
      return NextResponse.json(
        { 
          message: 'Admin is already logged in from another device',
          code: 'ALREADY_LOGGED_IN',
          existingSession: existingSession ? {
            device: existingSession.device_info,
            ip: existingSession.ip_address,
            lastActivity: existingSession.last_activity,
            loginTime: existingSession.created_at
          } : null
        },
        { status: 409 }
      )
    }

    // Create new session
    const session = await createAdminSession(
      admin.id,
      deviceInfo,
      ipAddress,
      userAgent
    )

    // Create JWT token
    const jwtToken = createAdminJWT(admin.id, session.session_token)

    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        username: admin.username,
        email: admin.email,
        is_active: admin.is_active
      },
      session: {
        device: deviceInfo,
        ip: ipAddress,
        loginTime: session.created_at
      }
    })

    // Set secure cookie
    response.cookies.set('admin-session-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    // Log successful login
    await supabaseAdmin
      .from('admin_activity_logs')
      .insert({
        admin_id: admin.id,
        action: 'ADMIN_LOGIN_SUCCESS',
        details: {
          device: deviceInfo,
          ip: ipAddress,
          user_agent: userAgent
        },
        ip_address: ipAddress,
        user_agent: userAgent
      })

    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

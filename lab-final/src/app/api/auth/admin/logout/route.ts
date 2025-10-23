import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminJWT, terminateSession } from '@/lib/admin-session-manager'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-session-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No active session' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = verifyAdminJWT(token)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid session token' },
        { status: 401 }
      )
    }

    // Terminate the session
    await terminateSession(decoded.sessionToken)

    // Clear the cookie
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    response.cookies.set('admin-session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

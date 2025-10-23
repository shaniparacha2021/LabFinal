import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth-middleware'
import { 
  getActiveAdminSession, 
  terminateAdminSessions, 
  cleanupExpiredSessions 
} from '@/lib/admin-session-manager'

// Get current session information
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    
    if (!authResult.isValid || !authResult.admin) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get session information
    const sessionInfo = await getActiveAdminSession(authResult.admin.id)

    return NextResponse.json({
      admin: authResult.admin,
      session: sessionInfo,
      isActive: !!sessionInfo
    })

  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { message: 'Failed to get session information' },
      { status: 500 }
    )
  }
}

// Terminate all sessions for admin (force logout from all devices)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    
    if (!authResult.isValid || !authResult.admin) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Terminate all sessions for this admin
    await terminateAdminSessions(authResult.admin.id)

    // Clean up expired sessions
    await cleanupExpiredSessions()

    return NextResponse.json({
      message: 'All sessions terminated successfully'
    })

  } catch (error) {
    console.error('Terminate sessions error:', error)
    return NextResponse.json(
      { message: 'Failed to terminate sessions' },
      { status: 500 }
    )
  }
}

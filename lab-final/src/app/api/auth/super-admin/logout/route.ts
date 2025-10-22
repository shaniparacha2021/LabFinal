import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('super-admin-token')?.value

    if (token) {
      try {
        // Decode token to get user info
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any
        
        // Invalidate all sessions for this user
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', decoded.userId)

        // Log logout activity
        await supabase
          .from('activity_logs')
          .insert({
            user_id: decoded.userId,
            email: decoded.email,
            action: 'LOGOUT',
            ip_address: 'unknown',
            user_agent: 'unknown',
            timestamp: new Date().toISOString()
          })
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError)
        // Continue with logout even if JWT is invalid
      }
    }

    // Clear the auth token cookie
    cookieStore.set('super-admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expire immediately
    })

    return NextResponse.json({
      message: 'Logged out successfully'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Logout failed' },
      { status: 500 }
    )
  }
}

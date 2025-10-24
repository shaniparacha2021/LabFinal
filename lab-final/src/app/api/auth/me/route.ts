import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No authentication token' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    return NextResponse.json({
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId
      }
    })

  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { message: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

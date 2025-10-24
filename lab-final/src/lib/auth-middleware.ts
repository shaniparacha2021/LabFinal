import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabase } from './supabase'

export interface AuthUser {
  userId: string
  email: string
  role: string
  type: string
}

export async function verifySuperAdminToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('super-admin-token')?.value

    if (!token) {
      return null
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    // Verify user exists and is Super Admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', decoded.userId)
      .eq('role', 'SUPER_ADMIN')
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return null
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'super_admin'
    }

  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export async function requireSuperAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await verifySuperAdminToken(request)
  
  if (!user) {
    throw new Error('Unauthorized access')
  }
  
  return user
}

export function createAuthResponse(message: string, status: number = 401) {
  return new Response(
    JSON.stringify({ message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

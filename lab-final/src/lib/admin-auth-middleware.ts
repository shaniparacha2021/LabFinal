import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminJWT, validateAdminSession } from './admin-session-manager'
import { supabaseAdmin } from './supabase'

export interface AdminAuthResult {
  isValid: boolean
  admin?: {
    id: string
    full_name: string
    username: string
    email: string
    is_active: boolean
  }
  session?: {
    id: string
    device_info?: string
    ip_address?: string
    last_activity: string
  }
  error?: string
}

/**
 * Validate admin authentication from request
 */
export async function validateAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-session-token')?.value

    if (!token) {
      return {
        isValid: false,
        error: 'No authentication token'
      }
    }

    // Verify JWT token
    const decoded = verifyAdminJWT(token)
    if (!decoded) {
      return {
        isValid: false,
        error: 'Invalid session token'
      }
    }

    // Validate session in database
    const session = await validateAdminSession(decoded.sessionToken)
    if (!session) {
      return {
        isValid: false,
        error: 'Session expired or invalid'
      }
    }

    // Get admin details
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, full_name, username, email, is_active')
      .eq('id', session.admin_id)
      .eq('is_active', true)
      .single()

    if (adminError || !admin) {
      return {
        isValid: false,
        error: 'Admin not found or inactive'
      }
    }

    return {
      isValid: true,
      admin,
      session: {
        id: session.id,
        device_info: session.device_info,
        ip_address: session.ip_address,
        last_activity: session.last_activity
      }
    }

  } catch (error) {
    console.error('Admin auth validation error:', error)
    return {
      isValid: false,
      error: 'Authentication validation failed'
    }
  }
}

/**
 * Middleware function to protect admin routes
 */
export async function requireAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  const authResult = await validateAdminAuth(request)
  
  if (!authResult.isValid) {
    throw new Error(authResult.error || 'Authentication required')
  }
  
  return authResult
}

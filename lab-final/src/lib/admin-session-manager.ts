import { supabaseAdmin } from './supabase'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export interface AdminSession {
  id: string
  admin_id: string
  session_token: string
  device_info?: string
  ip_address?: string
  user_agent?: string
  is_active: boolean
  last_activity: string
  created_at: string
  expires_at: string
}

export interface SessionInfo {
  session_id: string
  device_info?: string
  ip_address?: string
  last_activity: string
  created_at: string
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a new admin session
 */
export async function createAdminSession(
  adminId: string,
  deviceInfo?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AdminSession> {
  // First, terminate any existing sessions for this admin
  await terminateAdminSessions(adminId)
  
  // Generate new session token
  const sessionToken = generateSessionToken()
  
  // Create new session
  const { data: session, error } = await supabaseAdmin
    .from('admin_sessions')
    .insert({
      admin_id: adminId,
      session_token: sessionToken,
      device_info: deviceInfo,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_active: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create admin session: ${error.message}`)
  }

  return session
}

/**
 * Validate admin session token
 */
export async function validateAdminSession(sessionToken: string): Promise<AdminSession | null> {
  const { data: session, error } = await supabaseAdmin
    .from('admin_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !session) {
    return null
  }

  // Update last activity
  await updateSessionActivity(session.id)
  
  return session
}

/**
 * Check if admin has an active session
 */
export async function hasActiveAdminSession(adminId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('has_active_admin_session', { p_admin_id: adminId })

  if (error) {
    console.error('Error checking active session:', error)
    return false
  }

  return data === true
}

/**
 * Get active session information for admin
 */
export async function getActiveAdminSession(adminId: string): Promise<SessionInfo | null> {
  const { data, error } = await supabaseAdmin
    .rpc('get_active_admin_session', { p_admin_id: adminId })

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0] as SessionInfo
}

/**
 * Terminate all sessions for an admin
 */
export async function terminateAdminSessions(adminId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .rpc('terminate_admin_sessions', { p_admin_id: adminId })

  if (error) {
    throw new Error(`Failed to terminate admin sessions: ${error.message}`)
  }
}

/**
 * Terminate specific session
 */
export async function terminateSession(sessionToken: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('session_token', sessionToken)

  if (error) {
    throw new Error(`Failed to terminate session: ${error.message}`)
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    console.error('Error updating session activity:', error)
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const { error } = await supabaseAdmin
    .rpc('cleanup_expired_admin_sessions')

  if (error) {
    console.error('Error cleaning up expired sessions:', error)
  }
}

/**
 * Get device information from user agent
 */
export function getDeviceInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown Device'
  
  // Simple device detection
  if (userAgent.includes('Mobile')) {
    if (userAgent.includes('iPhone')) return 'iPhone'
    if (userAgent.includes('Android')) return 'Android Phone'
    return 'Mobile Device'
  }
  
  if (userAgent.includes('Tablet')) return 'Tablet'
  
  if (userAgent.includes('Windows')) return 'Windows PC'
  if (userAgent.includes('Mac')) return 'Mac'
  if (userAgent.includes('Linux')) return 'Linux PC'
  
  return 'Desktop'
}

/**
 * Create JWT token for admin session
 */
export function createAdminJWT(adminId: string, sessionToken: string): string {
  return jwt.sign(
    { 
      adminId, 
      sessionToken,
      type: 'admin_session'
    },
    process.env.NEXTAUTH_SECRET || 'fallback-secret',
    { expiresIn: '24h' }
  )
}

/**
 * Verify admin JWT token
 */
export function verifyAdminJWT(token: string): { adminId: string; sessionToken: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any
    if (decoded.type === 'admin_session') {
      return {
        adminId: decoded.adminId,
        sessionToken: decoded.sessionToken
      }
    }
    return null
  } catch (error) {
    return null
  }
}

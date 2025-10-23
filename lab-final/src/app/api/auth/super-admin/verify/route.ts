import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Find the verification code (using admin client to bypass RLS)
    const { data: verificationCode, error: codeError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (codeError || !verificationCode) {
      return NextResponse.json(
        { 
          message: 'Invalid verification code',
          code: 'INVALID_CODE'
        },
        { status: 400 }
      )
    }

    // Check if code is expired
    const now = new Date()
    const expiresAt = new Date(verificationCode.expires_at)
    
    if (now > expiresAt) {
      // Mark as used to prevent reuse (using admin client)
      await supabaseAdmin
        .from('verification_codes')
        .update({ is_used: true })
        .eq('id', verificationCode.id)

      return NextResponse.json(
        { 
          message: 'Verification code has expired',
          code: 'EXPIRED_CODE'
        },
        { status: 400 }
      )
    }

    // Mark code as used (using admin client)
    await supabaseAdmin
      .from('verification_codes')
      .update({ is_used: true, used_at: now.toISOString() })
      .eq('id', verificationCode.id)

    // Get user details (using admin client to bypass RLS)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', verificationCode.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        type: 'super_admin'
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('super-admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    // Create user session
    const sessionToken = jwt.sign(
      { userId: user.id, sessionId: Date.now().toString() },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        ip_address: 'unknown',
        user_agent: 'unknown'
      })

    // Clean up old verification codes for this user (using admin client)
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Log successful verification
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: user.id,
        email: user.email,
        action: 'VERIFICATION_SUCCESS',
        ip_address: 'unknown',
        user_agent: 'unknown',
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      message: 'Verification successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
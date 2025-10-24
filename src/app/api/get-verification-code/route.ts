import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { message: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Get the latest verification code for the email
    const { data: verificationCode, error } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !verificationCode) {
      return NextResponse.json(
        { 
          message: 'No active verification code found',
          error: error?.message
        },
        { status: 404 }
      )
    }

    // Check if code is expired
    const now = new Date()
    const expiresAt = new Date(verificationCode.expires_at)
    const isExpired = now > expiresAt

    return NextResponse.json({
      success: true,
      verificationCode: {
        id: verificationCode.id,
        code: verificationCode.code,
        email: verificationCode.email,
        expires_at: verificationCode.expires_at,
        is_expired: isExpired,
        created_at: verificationCode.created_at
      }
    })

  } catch (error) {
    console.error('Get verification code error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

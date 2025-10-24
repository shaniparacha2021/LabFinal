import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail, testEmailConfiguration } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Test email configuration first
    const isConfigValid = await testEmailConfiguration()
    
    if (!isConfigValid) {
      return NextResponse.json(
        { message: 'Email configuration is invalid' },
        { status: 500 }
      )
    }

    // Send test verification email
    const testCode = '123456'
    await sendVerificationEmail(email, testCode)

    return NextResponse.json({
      message: 'Test email sent successfully',
      email: email,
      code: testCode
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { message: 'Failed to send test email', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

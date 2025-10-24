'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface VerificationFormProps {
  email: string
  onBack: () => void
  onSuccess: () => void
}

export function VerificationForm({ email, onBack, onSuccess }: VerificationFormProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    
    for (let i = 0; i < 6; i++) {
      newCode[i] = pastedData[i] || ''
    }
    
    setCode(newCode)
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(digit => digit === '')
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()

    // Auto-submit if all digits are pasted
    if (pastedData.length === 6) {
      handleSubmit(pastedData)
    }
  }

  const handleSubmit = async (verificationCode?: string) => {
    const codeToSubmit = verificationCode || code.join('')
    if (codeToSubmit.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          code: codeToSubmit 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'INVALID_CODE') {
          setError('Invalid verification code. Please try again.')
        } else if (data.code === 'EXPIRED_CODE') {
          setError('Verification code has expired. Please request a new one.')
          setCanResend(true)
        } else if (data.code === 'CODE_USED') {
          setError('This code has already been used. Please request a new one.')
          setCanResend(true)
        } else {
          setError(data.message || 'Verification failed. Please try again.')
        }
        return
      }

      setSuccess('Verification successful! Redirecting to dashboard...')
      
      // Log successful verification
      await fetch('/api/auth/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action: 'VERIFICATION_SUCCESS',
          ip: await getClientIP(),
        }),
      })

      // Redirect to dashboard
      setTimeout(() => {
        onSuccess()
      }, 1500)

    } catch (error) {
      console.error('Verification error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to resend code. Please try again.')
        return
      }

      setSuccess('New verification code sent to your email!')
      setTimeLeft(300) // Reset timer
      setCanResend(false)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()

      // Log resend attempt
      await fetch('/api/auth/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action: 'CODE_RESEND',
          ip: await getClientIP(),
        }),
      })

    } catch (error) {
      console.error('Resend error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to<br />
          <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Label>Verification Code</Label>
          <div className="flex justify-center space-x-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-lg font-mono"
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <div className="text-center space-y-2">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-600">
              Code expires in <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <p className="text-sm text-red-600 font-medium">
              Code has expired
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => handleSubmit()} 
            className="w-full" 
            disabled={isLoading || code.some(digit => digit === '')}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          {canResend && (
            <Button 
              onClick={handleResendCode} 
              variant="outline" 
              className="w-full"
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Code
                </>
              )}
            </Button>
          )}

          <Button 
            onClick={onBack} 
            variant="ghost" 
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

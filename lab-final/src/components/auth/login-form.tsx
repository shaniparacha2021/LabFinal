'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LoginFormProps {
  onSuccess: (email: string) => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/super-admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'ACCOUNT_LOCKED') {
          setIsLocked(true)
          setLockoutTime(new Date(data.lockoutUntil))
          setError('Account temporarily locked due to multiple failed attempts. Please try again later.')
        } else if (data.code === 'INVALID_CREDENTIALS') {
          const newAttempts = attempts + 1
          setAttempts(newAttempts)
          
          if (newAttempts >= 5) {
            setIsLocked(true)
            setLockoutTime(new Date(Date.now() + 15 * 60 * 1000)) // 15 minutes
            setError('Too many failed attempts. Account locked for 15 minutes.')
          } else {
            setError(`Invalid credentials. ${5 - newAttempts} attempts remaining.`)
          }
        } else {
          setError(data.message || 'Login failed. Please try again.')
        }
        return
      }

      // Reset attempts on successful login
      setAttempts(0)
      
      // Log successful login attempt
      await fetch('/api/auth/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action: 'LOGIN_SUCCESS',
          ip: await getClientIP(),
        }),
      })

      // Proceed to verification
      onSuccess(email)
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
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

  const getRemainingLockoutTime = () => {
    if (!lockoutTime) return ''
    const now = new Date()
    const diff = lockoutTime.getTime() - now.getTime()
    if (diff <= 0) {
      setIsLocked(false)
      setLockoutTime(null)
      return ''
    }
    const minutes = Math.ceil(diff / (1000 * 60))
    return `${minutes} minutes`
  }

  if (isLocked) {
    const remainingTime = getRemainingLockoutTime()
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">Account Locked</CardTitle>
          <CardDescription>
            Too many failed login attempts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your account has been temporarily locked for security reasons.
              {remainingTime && ` Please try again in ${remainingTime}.`}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => {
              setIsLocked(false)
              setAttempts(0)
              setLockoutTime(null)
            }}
            className="w-full"
            disabled={!!remainingTime}
          >
            {remainingTime ? `Try Again in ${remainingTime}` : 'Try Again'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Super Admin Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

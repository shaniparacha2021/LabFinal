'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff, AlertTriangle, Monitor } from 'lucide-react'

interface ExistingSession {
  device: string
  ip: string
  lastActivity: string
  loginTime: string
}

export function AdminLoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingSession, setExistingSession] = useState<ExistingSession | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setExistingSession(null)

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Login successful
        router.push('/admin/dashboard')
      } else if (response.status === 409 && data.code === 'ALREADY_LOGGED_IN') {
        // Admin already logged in from another device
        setExistingSession(data.existingSession)
        setError('You are already logged in from another device. Please log out from the other device first.')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Monitor className="h-6 w-6" />
          Admin Login
        </CardTitle>
        <CardDescription>
          Sign in to your admin account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {existingSession && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-orange-800">Active Session Detected</p>
                  <div className="text-sm text-orange-700 space-y-1">
                    <p><strong>Device:</strong> {existingSession.device}</p>
                    <p><strong>IP Address:</strong> {existingSession.ip}</p>
                    <p><strong>Last Activity:</strong> {formatDate(existingSession.lastActivity)}</p>
                    <p><strong>Login Time:</strong> {formatDate(existingSession.loginTime)}</p>
                  </div>
                  <p className="text-sm text-orange-600 mt-2">
                    Please log out from the other device before logging in here.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={loading}
                className="pl-10"
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
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={loading}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Security Notice:</p>
          <p className="text-xs mt-1">
            You can only be logged in from one device at a time. 
            Logging in from a new device will automatically log you out from other devices.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

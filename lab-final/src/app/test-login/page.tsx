'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestLoginPage() {
  const [email, setEmail] = useState('shaniparacha2021@gmail.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const testLogin = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/debug-complete-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      setResult(data)
      
      if (!data.success) {
        setError(data.message || 'Test failed')
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const testSimpleLogin = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/auth/super-admin/login-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      setResult(data)
      
      if (!response.ok) {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Login Test Page</CardTitle>
          <CardDescription>
            Test login functionality and debug authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button 
              onClick={testLogin} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test Complete Login Debug'}
            </Button>
            <Button 
              onClick={testSimpleLogin} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test Simple Login'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertDescription>
                  {result.success ? '✅ Test Passed!' : '❌ Test Failed'}
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Test Results:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p><strong>Default Credentials:</strong></p>
            <p>Email: shaniparacha2021@gmail.com</p>
            <p>Password: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('shaniparacha2021@gmail.com')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const handleTestEmail = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          type: 'success',
          message: `Test email sent successfully to ${email}! Check your inbox for the verification code: ${data.code}`
        })
      } else {
        setResult({
          type: 'error',
          message: data.message || 'Failed to send test email'
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Network error. Please check your connection.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <span>Email Test</span>
          </CardTitle>
          <CardDescription>
            Test the email configuration for verification codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <Alert variant={result.type === 'success' ? 'default' : 'destructive'}>
              {result.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              disabled={isLoading}
            />
          </div>

          <Button 
            onClick={handleTestEmail} 
            className="w-full" 
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              This will send a test verification email to verify your Gmail configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

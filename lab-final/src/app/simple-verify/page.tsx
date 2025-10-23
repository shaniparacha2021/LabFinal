'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SimpleVerify() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    console.log('🔍 Simple verify - email param:', emailParam)
    setEmail(emailParam)
    
    if (!emailParam) {
      console.log('❌ No email parameter, redirecting to login')
      router.push('/super-admin/login')
      return
    }
    console.log('✅ Email parameter found:', emailParam)
  }, [searchParams, router])

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔐 Verifying code:', code, 'for email:', email)
      
      const response = await fetch('/api/auth/super-admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()
      console.log('📡 Verification response:', { status: response.status, data })

      if (response.ok) {
        console.log('✅ Verification successful, redirecting to dashboard')
        router.push('/super-admin/dashboard')
      } else {
        console.log('❌ Verification failed:', data)
        setError(data.message || 'Verification failed')
      }
    } catch (error) {
      console.error('💥 Verification error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Simple Verification</h1>
        <p className="mb-4">Email: {email}</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={6}
          />
        </div>
        
        <button 
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
        
        <button 
          onClick={() => router.push('/super-admin/login')}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 mt-2"
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}

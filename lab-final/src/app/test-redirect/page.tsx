'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function TestRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    console.log('🔍 Test page - email param:', emailParam)
    setEmail(emailParam)
  }, [searchParams])

  const handleRedirect = () => {
    console.log('🔗 Redirecting to verification page with email:', email)
    router.push(`/super-admin/verify?email=${encodeURIComponent(email || '')}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Test Redirect</h1>
        <p className="mb-4">Email parameter: {email || 'None'}</p>
        <button 
          onClick={handleRedirect}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Test Redirect to Verification
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

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading test page...</p>
      </div>
    </div>
  )
}

export default function TestRedirect() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TestRedirectContent />
    </Suspense>
  )
}

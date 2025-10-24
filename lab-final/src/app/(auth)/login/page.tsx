'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { VerificationForm } from '@/components/auth/verification-form'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [step, setStep] = useState<'login' | 'verification'>('login')
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleLoginSuccess = (userEmail: string) => {
    setEmail(userEmail)
    setStep('verification')
  }

  const handleVerificationSuccess = () => {
    router.push('/dashboard')
  }

  const handleBackToLogin = () => {
    setStep('login')
    setEmail('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              LabFinal
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Super Admin Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Secure access to the Lab Management System
          </p>
        </div>

        {/* Authentication Forms */}
        {step === 'login' ? (
          <LoginForm onSuccess={handleLoginSuccess} />
        ) : (
          <VerificationForm 
            email={email}
            onBack={handleBackToLogin}
            onSuccess={handleVerificationSuccess}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help? Contact system administrator
          </p>
        </div>
      </div>
    </div>
  )
}

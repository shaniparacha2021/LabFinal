'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'

interface AdminFormProps {
  admin?: {
    id: string
    full_name: string
    username: string
    email: string
    mobile_number?: string
    is_active: boolean
  }
  onSubmit: (data: AdminFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export interface AdminFormData {
  full_name: string
  username: string
  email: string
  mobile_number: string
  password: string
  is_active: boolean
}

export function AdminForm({ admin, onSubmit, onCancel, loading = false }: AdminFormProps) {
  const [formData, setFormData] = useState<AdminFormData>({
    full_name: admin?.full_name || '',
    username: admin?.username || '',
    email: admin?.email || '',
    mobile_number: admin?.mobile_number || '',
    password: '',
    is_active: admin?.is_active ?? true
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.full_name.trim()) {
      setError('Full name is required')
      return
    }
    if (!formData.username.trim()) {
      setError('Username is required')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }
    if (!admin && !formData.password.trim()) {
      setError('Password is required for new admins')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Username validation (alphanumeric and underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleInputChange = (field: keyof AdminFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {admin ? 'Edit Admin' : 'Add New Admin'}
        </CardTitle>
        <CardDescription>
          {admin ? 'Update admin information and settings' : 'Create a new admin account with access to the system'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="mobile_number"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={formData.mobile_number}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {!admin && '*'}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={admin ? 'Leave blank to keep current password' : 'Enter password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required={!admin}
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
            {admin && (
              <p className="text-sm text-gray-500">
                Leave password blank to keep the current password
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              disabled={loading}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active">Active Account</Label>
            <p className="text-sm text-gray-500">
              Inactive accounts cannot log in to the system
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {admin ? 'Update Admin' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

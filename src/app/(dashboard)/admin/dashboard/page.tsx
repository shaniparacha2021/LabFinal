'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Monitor, 
  LogOut, 
  Shield, 
  Clock, 
  MapPin, 
  User,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface AdminInfo {
  id: string
  full_name: string
  username: string
  email: string
  is_active: boolean
}

interface SessionInfo {
  session_id: string
  device_info?: string
  ip_address?: string
  last_activity: string
  created_at: string
}

interface DashboardData {
  admin: AdminInfo
  session: SessionInfo | null
  isActive: boolean
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoutLoading, setLogoutLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/session')
      
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else if (response.status === 401) {
        router.push('/admin/login')
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      const response = await fetch('/api/auth/admin/logout', {
        method: 'POST'
      })

      if (response.ok) {
        router.push('/admin/login')
      } else {
        setError('Logout failed')
      }
    } catch (err) {
      setError('Network error during logout')
    } finally {
      setLogoutLoading(false)
    }
  }

  const handleTerminateAllSessions = async () => {
    try {
      const response = await fetch('/api/admin/session', {
        method: 'DELETE'
      })

      if (response.ok) {
        // Force logout current session
        await handleLogout()
      } else {
        setError('Failed to terminate sessions')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No dashboard data available</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {dashboardData.admin.full_name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTerminateAllSessions}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Shield className="h-4 w-4 mr-2" />
                Logout All Devices
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Session Status */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Session Information
              </CardTitle>
              <CardDescription>
                Current login session details and security status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.isActive && dashboardData.session ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Active Session</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Device:</span>
                        <span className="text-sm text-gray-600">
                          {dashboardData.session.device_info || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">IP Address:</span>
                        <span className="text-sm text-gray-600">
                          {dashboardData.session.ip_address || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Login Time:</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(dashboardData.session.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Last Activity:</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(dashboardData.session.last_activity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">No Active Session</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Information */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Admin Information
              </CardTitle>
              <CardDescription>
                Your account details and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Full Name:</span>
                    <p className="text-sm text-gray-600">{dashboardData.admin.full_name}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Username:</span>
                    <p className="text-sm text-gray-600">{dashboardData.admin.username}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <p className="text-sm text-gray-600">{dashboardData.admin.email}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <div className="flex items-center gap-2">
                      {dashboardData.admin.is_active ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Shield className="h-5 w-5" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-orange-700 space-y-2">
              <p className="font-medium">Single Session Security</p>
              <p className="text-sm">
                For security reasons, you can only be logged in from one device at a time. 
                If you log in from a new device, you will be automatically logged out from other devices.
              </p>
              <p className="text-sm">
                Use the "Logout All Devices" button if you suspect unauthorized access to your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

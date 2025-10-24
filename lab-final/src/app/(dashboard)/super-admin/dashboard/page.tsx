'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Shield, 
  Activity, 
  Lock, 
  TrendingUp, 
  Clock,
  LogOut,
  Settings,
  BarChart3,
  AlertTriangle,
  UserPlus,
  CreditCard,
  Image,
  Megaphone
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalLoginAttempts: number
  successfulLogins: number
  failedLoginsToday: number
  loginSuccessRate: number
  activeSessions: number
  activeLockouts: number
  roleDistribution: Record<string, number>
  activityStats: Record<string, number>
}

interface ActivityLog {
  id: string
  email: string
  action: string
  timestamp: string
  ip_address: string
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchDashboardData()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/super-admin/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/super-admin/login')
      }
    } catch (error) {
      router.push('/super-admin/login')
    }
  }

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/super-admin/dashboard/stats'),
        fetch('/api/super-admin/activity-logs?limit=5')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
        setRecentActivity(statsData.recentActivity)
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/super-admin/logout', { method: 'POST' })
      router.push('/super-admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return 'default'
      case 'LOGOUT':
        return 'secondary'
      case 'PASSWORD_CHANGED':
        return 'destructive'
      case 'VERIFICATION_SUCCESS':
        return 'default'
      default:
        return 'outline'
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Super Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Button variant="default" size="sm" onClick={() => router.push('/super-admin/admin-management')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Admin Management
              </Button>
              <Button variant="default" size="sm" onClick={() => router.push('/super-admin/subscription-management')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Subscriptions
              </Button>
              <Button variant="default" size="sm" onClick={() => router.push('/super-admin/announcements')}>
                <Megaphone className="h-4 w-4 mr-2" />
                Announcements
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/super-admin/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active users in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.loginSuccessRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently logged in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Lockouts</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeLockouts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently locked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest system activities and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getActionBadgeVariant(activity.action)}>
                            {activity.action.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm font-medium">{activity.email}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                System Overview
              </CardTitle>
              <CardDescription>
                Key metrics and system health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Failed Logins Today</span>
                  <Badge variant="destructive">{stats?.failedLoginsToday || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Login Attempts</span>
                  <Badge variant="outline">{stats?.totalLoginAttempts || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Successful Logins</span>
                  <Badge variant="default">{stats?.successfulLogins || 0}</Badge>
                </div>
                {stats?.roleDistribution && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">User Roles</h4>
                    {Object.entries(stats.roleDistribution).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">{role.replace('_', ' ')}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Bell, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  Database, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'

interface DashboardStats {
  totalAdmins: number
  activeAdmins: number
  suspendedAdmins: number
  totalSubscriptions: number
  activeSubscriptions: number
  expiredSubscriptions: number
  totalRevenue: number
  monthlyRevenue: number
  totalNotifications: number
  unreadNotifications: number
  totalBackups: number
  lastBackupDate: string
}

interface SubscriptionAnalytics {
  byPlan: {
    trial: number
    monthly: number
    annual: number
    lifetime: number
  }
  byStatus: {
    active: number
    expired: number
    pending: number
  }
  revenueByPlan: {
    trial: number
    monthly: number
    annual: number
    lifetime: number
  }
}

interface AdminActivity {
  totalLogins: number
  activeToday: number
  newThisWeek: number
  topActions: Array<{
    action: string
    count: number
  }>
}

interface BackupHistory {
  id: string
  type: string
  status: string
  size: string
  createdAt: string
  description: string
}

export default function EnhancedSuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null)
  const [adminActivity, setAdminActivity] = useState<AdminActivity | null>(null)
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/super-admin/dashboard/enhanced-stats')
      const statsData = await statsResponse.json()
      setStats(statsData.stats)

      // Fetch subscription analytics
      const analyticsResponse = await fetch('/api/super-admin/dashboard/subscription-analytics')
      const analyticsData = await analyticsResponse.json()
      setSubscriptionAnalytics(analyticsData.analytics)

      // Fetch admin activity
      const activityResponse = await fetch('/api/super-admin/dashboard/admin-activity')
      const activityData = await activityResponse.json()
      setAdminActivity(activityData.activity)

      // Fetch backup history
      const backupResponse = await fetch('/api/super-admin/dashboard/backup-history')
      const backupData = await backupResponse.json()
      setBackupHistory(backupData.backups)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive analytics and management overview</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAdmins || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeAdmins || 0} active, {stats?.suspendedAdmins || 0} suspended
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSubscriptions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeSubscriptions || 0} active, {stats?.expiredSubscriptions || 0} expired
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats?.monthlyRevenue || 0)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalNotifications || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.unreadNotifications || 0} unread
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Status Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Subscription Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Active</span>
                      </div>
                      <span className="font-semibold">{subscriptionAnalytics?.byStatus.active || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Expired</span>
                      </div>
                      <span className="font-semibold">{subscriptionAnalytics?.byStatus.expired || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Pending</span>
                      </div>
                      <span className="font-semibold">{subscriptionAnalytics?.byStatus.pending || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Plan Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Revenue by Plan Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Trial</span>
                      <span className="font-semibold">{formatCurrency(subscriptionAnalytics?.revenueByPlan.trial || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly</span>
                      <span className="font-semibold">{formatCurrency(subscriptionAnalytics?.revenueByPlan.monthly || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Annual</span>
                      <span className="font-semibold">{formatCurrency(subscriptionAnalytics?.revenueByPlan.annual || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lifetime</span>
                      <span className="font-semibold">{formatCurrency(subscriptionAnalytics?.revenueByPlan.lifetime || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Analytics</CardTitle>
                <CardDescription>Detailed breakdown of subscription data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{subscriptionAnalytics?.byPlan.trial || 0}</div>
                    <div className="text-sm text-blue-600">Trial Plans</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{subscriptionAnalytics?.byPlan.monthly || 0}</div>
                    <div className="text-sm text-green-600">Monthly Plans</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{subscriptionAnalytics?.byPlan.annual || 0}</div>
                    <div className="text-sm text-purple-600">Annual Plans</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{subscriptionAnalytics?.byPlan.lifetime || 0}</div>
                    <div className="text-sm text-orange-600">Lifetime Plans</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Admin Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Logins</span>
                      <span className="font-semibold">{adminActivity?.totalLogins || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Today</span>
                      <span className="font-semibold">{adminActivity?.activeToday || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New This Week</span>
                      <span className="font-semibold">{adminActivity?.newThisWeek || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {adminActivity?.topActions.map((action, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{action.action}</span>
                        <Badge variant="secondary">{action.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Backups Tab */}
          <TabsContent value="backups" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Backup History
                    </CardTitle>
                    <CardDescription>System backup and restore operations</CardDescription>
                  </div>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backupHistory.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Database className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{backup.type}</div>
                          <div className="text-sm text-gray-500">{backup.description}</div>
                          <div className="text-xs text-gray-400">{formatDate(backup.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={backup.status === 'completed' ? 'default' : 'secondary'}>
                          {backup.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{backup.size}</span>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Search and Filter Controls */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Advanced Search & Filtering</CardTitle>
            <CardDescription>Search and filter across all dashboard data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search across all data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="last_activity">Last Activity</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'} Sort
              </Button>
              <Button variant="outline" onClick={fetchDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

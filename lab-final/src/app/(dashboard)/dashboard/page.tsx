'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Tenant {
  id: string
  name: string
  slug: string
  subscription_type: string
  subscription_status: string
  created_at: string
  users_count?: number
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    checkAuth()
    // Load tenants data
    loadTenants()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    }
  }

  const loadTenants = async () => {
    try {
      setIsLoading(true)
      // This would be replaced with actual API call
      // For now, showing mock data
      const mockTenants: Tenant[] = [
        {
          id: '1',
          name: 'ABC Medical Laboratory',
          slug: 'abc-medical-lab',
          subscription_type: 'TRIAL',
          subscription_status: 'ACTIVE',
          created_at: '2024-01-15T10:30:00Z',
          users_count: 5
        },
        {
          id: '2',
          name: 'XYZ Diagnostic Center',
          slug: 'xyz-diagnostic',
          subscription_type: 'MONTHLY',
          subscription_status: 'ACTIVE',
          created_at: '2024-01-20T14:45:00Z',
          users_count: 12
        },
        {
          id: '3',
          name: 'City Health Lab',
          slug: 'city-health-lab',
          subscription_type: 'ANNUAL',
          subscription_status: 'ACTIVE',
          created_at: '2024-02-01T09:15:00Z',
          users_count: 8
        }
      ]
      setTenants(mockTenants)
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSubscriptionBadgeVariant = (type: string) => {
    switch (type) {
      case 'TRIAL': return 'secondary'
      case 'MONTHLY': return 'default'
      case 'ANNUAL': return 'default'
      case 'LIFETIME': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'INACTIVE': return 'secondary'
      case 'CANCELLED': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  LabFinal
                </span>
              </div>
              <Badge variant="outline" className="ml-4">
                Super Admin
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Labs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.subscription_status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((tenants.filter(t => t.subscription_status === 'ACTIVE').length / tenants.length) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.reduce((sum, tenant) => sum + (tenant.users_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all laboratories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450</div>
              <p className="text-xs text-muted-foreground">
                +15% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Labs Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Laboratory Management</CardTitle>
                <CardDescription>
                  Manage all laboratories and their subscriptions
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lab
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search laboratories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Labs Table */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading laboratories...</p>
                </div>
              ) : filteredTenants.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No laboratories found</p>
                </div>
              ) : (
                filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {tenant.name}
                          </h3>
                          <Badge variant={getSubscriptionBadgeVariant(tenant.subscription_type)}>
                            {tenant.subscription_type}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(tenant.subscription_status)}>
                            {tenant.subscription_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Slug: {tenant.slug} • Users: {tenant.users_count || 0} • 
                          Created: {new Date(tenant.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

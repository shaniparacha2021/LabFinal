'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, Search, Filter, Eye, Edit, Trash2, CreditCard, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Subscription {
  id: string
  admin_id: string
  plan_type: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME'
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_RENEWAL' | 'SUSPENDED' | 'CANCELLED'
  start_date: string
  expiry_date: string | null
  auto_renew: boolean
  payment_status: 'PAID' | 'PENDING' | 'OVERDUE' | 'FAILED' | 'REFUNDED'
  amount_paid_pkr: number
  transaction_reference: string | null
  payment_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  admins: {
    id: string
    full_name: string
    username: string
    email: string
    mobile_number: string
    is_active: boolean
  }
  subscription_plans: {
    id: string
    plan_name: string
    display_name: string
    price_pkr: number
    duration_days: number
  }
}

interface SubscriptionListProps {
  onCreateNew: () => void
  onViewDetails: (subscription: Subscription) => void
  onEdit: (subscription: Subscription) => void
  onManagePayments: (subscription: Subscription) => void
}

export default function SubscriptionList({
  onCreateNew,
  onViewDetails,
  onEdit,
  onManagePayments
}: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planTypeFilter, setPlanTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    fetchSubscriptions()
  }, [currentPage, statusFilter, planTypeFilter])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (statusFilter) params.append('status', statusFilter)
      if (planTypeFilter) params.append('planType', planTypeFilter)

      const response = await fetch(`/api/super-admin/subscriptions?${params}`)
      const data = await response.json()

      if (response.ok) {
        setSubscriptions(data.subscriptions || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setStats(data.stats || {})
      } else {
        console.error('Failed to fetch subscriptions:', data.message)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'ACTIVE': 'default',
      'EXPIRED': 'destructive',
      'PENDING_RENEWAL': 'secondary',
      'SUSPENDED': 'outline',
      'CANCELLED': 'destructive'
    }
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PAID': 'default',
      'PENDING': 'secondary',
      'OVERDUE': 'destructive',
      'FAILED': 'destructive',
      'REFUNDED': 'outline'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getPlanTypeBadge = (planType: string) => {
    const colors: Record<string, string> = {
      'TRIAL': 'bg-blue-100 text-blue-800',
      'MONTHLY': 'bg-green-100 text-green-800',
      'ANNUAL': 'bg-purple-100 text-purple-800',
      'LIFETIME': 'bg-gold-100 text-gold-800'
    }
    return <Badge className={colors[planType] || 'bg-gray-100 text-gray-800'}>{planType}</Badge>
  }

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.admins.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.admins.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.admins.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-gray-600">Manage admin subscriptions and payments</p>
        </div>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Subscription
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Renewal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingRenewal || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="PENDING_RENEWAL">Pending Renewal</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Plans</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="ANNUAL">Annual</SelectItem>
                <SelectItem value="LIFETIME">Lifetime</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setStatusFilter('')
              setPlanTypeFilter('')
              setSearchTerm('')
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.admins.full_name}</div>
                        <div className="text-sm text-gray-500">{subscription.admins.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPlanTypeBadge(subscription.plan_type)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(subscription.payment_status)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">PKR {subscription.amount_paid_pkr.toLocaleString()}</div>
                      {subscription.subscription_plans.price_pkr > subscription.amount_paid_pkr && (
                        <div className="text-sm text-gray-500">
                          Due: PKR {(subscription.subscription_plans.price_pkr - subscription.amount_paid_pkr).toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscription.expiry_date ? (
                        <div>
                          <div className="font-medium">
                            {format(new Date(subscription.expiry_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(subscription.expiry_date) < new Date() ? 'Expired' : 'Active'}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">Lifetime</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(subscription)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(subscription)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onManagePayments(subscription)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Manage Payments
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

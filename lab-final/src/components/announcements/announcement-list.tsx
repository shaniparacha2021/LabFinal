'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Megaphone, 
  Calendar,
  AlertTriangle,
  Pin,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'

interface Announcement {
  id: string
  title: string
  description: string
  announcement_type: 'SYSTEM_UPDATES' | 'MAINTENANCE_ALERTS' | 'NEW_FEATURE_RELEASES' | 'SUBSCRIPTION_OFFERS' | 'GENERAL_NOTICES'
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED'
  image_url?: string
  link_url?: string
  link_text?: string
  visibility_start_date: string
  visibility_end_date?: string
  is_urgent: boolean
  is_pinned: boolean
  notification_type: 'POPUP' | 'BANNER' | 'BOTH'
  target_audience: string[]
  created_at: string
  updated_at: string
  created_by_user?: {
    name: string
    email: string
  }
  broadcasts?: Array<{
    id: string
    status: string
    total_recipients: number
    successful_deliveries: number
    broadcasted_at?: string
  }>
  view_count?: Array<{ count: number }>
}

interface AnnouncementListProps {
  onEdit: (announcement: Announcement) => void
  onDelete: (id: string) => void
  onBroadcast: (id: string) => void
  onView: (id: string) => void
}

export default function AnnouncementList({
  onEdit,
  onDelete,
  onBroadcast,
  onView
}: AnnouncementListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<any>(null)

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder
      })

      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`/api/super-admin/announcements?${params}`)
      const data = await response.json()

      if (data.success) {
        setAnnouncements(data.data)
        setTotalPages(data.pagination.totalPages)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [page, searchTerm, statusFilter, typeFilter, sortBy, sortOrder])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'ACTIVE': 'default',
      'DRAFT': 'secondary',
      'ARCHIVED': 'outline',
      'EXPIRED': 'destructive'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'SYSTEM_UPDATES': 'bg-blue-100 text-blue-800',
      'MAINTENANCE_ALERTS': 'bg-orange-100 text-orange-800',
      'NEW_FEATURE_RELEASES': 'bg-green-100 text-green-800',
      'SUBSCRIPTION_OFFERS': 'bg-purple-100 text-purple-800',
      'GENERAL_NOTICES': 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace(/_/g, ' ')}
      </span>
    )
  }

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'POPUP': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'BANNER': return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'BOTH': return <Users className="h-4 w-4 text-purple-500" />
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="SYSTEM_UPDATES">System Updates</SelectItem>
            <SelectItem value="MAINTENANCE_ALERTS">Maintenance Alerts</SelectItem>
            <SelectItem value="NEW_FEATURE_RELEASES">New Feature Releases</SelectItem>
            <SelectItem value="SUBSCRIPTION_OFFERS">Subscription Offers</SelectItem>
            <SelectItem value="GENERAL_NOTICES">General Notices</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => window.location.reload()}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>
            Manage system-wide announcements and broadcasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Broadcast</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {announcement.is_pinned && <Pin className="h-4 w-4 text-yellow-500" />}
                      {announcement.is_urgent && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      <div>
                        <div className="font-medium">{announcement.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {announcement.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getNotificationTypeIcon(announcement.notification_type)}
                      {getTypeBadge(announcement.announcement_type)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Start: {format(new Date(announcement.visibility_start_date), 'MMM dd, yyyy')}</div>
                      {announcement.visibility_end_date && (
                        <div>End: {format(new Date(announcement.visibility_end_date), 'MMM dd, yyyy')}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {announcement.broadcasts && announcement.broadcasts.length > 0 ? (
                      <div className="text-sm">
                        <div className="text-green-600">✓ Broadcasted</div>
                        <div className="text-gray-500">
                          {announcement.broadcasts[0].total_recipients} recipients
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Not broadcasted</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(announcement.created_at), 'MMM dd, yyyy')}</div>
                      <div className="text-gray-500">
                        by {announcement.created_by_user?.name || 'System'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(announcement.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(announcement)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {announcement.status === 'ACTIVE' && !announcement.broadcasts?.length && (
                          <DropdownMenuItem onClick={() => onBroadcast(announcement.id)}>
                            <Megaphone className="h-4 w-4 mr-2" />
                            Broadcast
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onDelete(announcement.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
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

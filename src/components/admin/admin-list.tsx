'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  Image,
  Calendar
} from 'lucide-react'

interface Admin {
  id: string
  full_name: string
  username: string
  email: string
  mobile_number?: string
  is_active: boolean
  created_at: string
  created_by_user?: {
    name: string
    email: string
  }
}

interface AdminListProps {
  admins: Admin[]
  loading?: boolean
  onAddAdmin: () => void
  onEditAdmin: (admin: Admin) => void
  onViewAdmin: (admin: Admin) => void
  onDeleteAdmin: (admin: Admin) => void
  onToggleStatus: (admin: Admin) => void
  onManageAssets: (admin: Admin) => void
}

export function AdminList({ 
  admins, 
  loading = false, 
  onAddAdmin, 
  onEditAdmin, 
  onViewAdmin, 
  onDeleteAdmin, 
  onToggleStatus,
  onManageAssets 
}: AdminListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Filter admins based on search term and status
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && admin.is_active) ||
      (statusFilter === 'inactive' && !admin.is_active)
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Admin Management
            </CardTitle>
            <CardDescription>
              Manage admin accounts and their access to the system
            </CardDescription>
          </div>
          <Button onClick={onAddAdmin} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search admins by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({admins.length})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active ({admins.filter(a => a.is_active).length})
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive ({admins.filter(a => !a.is_active).length})
            </Button>
          </div>
        </div>

        {/* Admins Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading admins...</span>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No admins found' : 'No admins yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first admin account'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={onAddAdmin}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Admin
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{admin.full_name}</div>
                        <div className="text-sm text-gray-500">@{admin.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{admin.email}</div>
                        {admin.mobile_number && (
                          <div className="text-sm text-gray-500">{admin.mobile_number}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(admin.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.created_by_user ? (
                        <div className="text-sm">
                          <div>{admin.created_by_user.name}</div>
                          <div className="text-gray-500">{admin.created_by_user.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewAdmin(admin)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditAdmin(admin)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onManageAssets(admin)}>
                            <Image className="h-4 w-4 mr-2" />
                            Manage Assets
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleStatus(admin)}>
                            {admin.is_active ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteAdmin(admin)}
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
          </div>
        )}

        {/* Results Summary */}
        {filteredAdmins.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {filteredAdmins.length} of {admins.length} admins
          </div>
        )}
      </CardContent>
    </Card>
  )
}

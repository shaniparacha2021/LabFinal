'use client'

import { useState, useEffect } from 'react'
import { AdminList } from '@/components/admin/admin-list'
import { AdminForm, AdminFormData } from '@/components/admin/admin-form'
import { AssetList } from '@/components/admin/asset-list'
import { AssetForm, AssetFormData } from '@/components/admin/asset-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Image, 
  Plus, 
  ArrowLeft, 
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle
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

interface Asset {
  id: string
  asset_type: 'header_image' | 'footer_image' | 'watermark_image'
  asset_name: string
  file_path: string
  github_url?: string
  file_size?: number
  mime_type?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type ViewMode = 'list' | 'add' | 'edit' | 'assets'

export default function AdminManagementPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [adminAssets, setAdminAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load admins on component mount
  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/super-admin/admins')
      const data = await response.json()
      
      if (response.ok) {
        setAdmins(data.admins || [])
      } else {
        setError(data.message || 'Failed to load admins')
      }
    } catch (err) {
      setError('Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  const loadAdminAssets = async (adminId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/admins/${adminId}/assets`)
      const data = await response.json()
      
      if (response.ok) {
        setAdminAssets(data.assets || [])
      } else {
        setError(data.message || 'Failed to load admin assets')
      }
    } catch (err) {
      setError('Failed to load admin assets')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = () => {
    setSelectedAdmin(null)
    setViewMode('add')
    setError('')
    setSuccess('')
  }

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setViewMode('edit')
    setError('')
    setSuccess('')
  }

  const handleViewAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setViewMode('assets')
    loadAdminAssets(admin.id)
    setError('')
    setSuccess('')
  }

  const handleManageAssets = (admin: Admin) => {
    setSelectedAdmin(admin)
    setViewMode('assets')
    loadAdminAssets(admin.id)
    setError('')
    setSuccess('')
  }

  const handleDeleteAdmin = async (admin: Admin) => {
    if (!confirm(`Are you sure you want to delete admin "${admin.full_name}"? This will also delete all their assets.`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/admins/${admin.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSuccess(`Admin "${admin.full_name}" deleted successfully`)
        loadAdmins()
        setViewMode('list')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to delete admin')
      }
    } catch (err) {
      setError('Failed to delete admin')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (admin: Admin) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/admins/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...admin,
          is_active: !admin.is_active
        })
      })
      
      if (response.ok) {
        setSuccess(`Admin "${admin.full_name}" ${!admin.is_active ? 'activated' : 'deactivated'} successfully`)
        loadAdmins()
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update admin status')
      }
    } catch (err) {
      setError('Failed to update admin status')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAdmin = async (formData: AdminFormData) => {
    try {
      setLoading(true)
      const url = selectedAdmin 
        ? `/api/super-admin/admins/${selectedAdmin.id}`
        : '/api/super-admin/admins'
      
      const method = selectedAdmin ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(data.message || 'Admin saved successfully')
        loadAdmins()
        setViewMode('list')
      } else {
        setError(data.message || 'Failed to save admin')
      }
    } catch (err) {
      setError('Failed to save admin')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAsset = async (formData: AssetFormData) => {
    if (!selectedAdmin) return

    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/admins/${selectedAdmin.id}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(data.message || 'Asset assigned successfully')
        loadAdminAssets(selectedAdmin.id)
        setViewMode('assets')
      } else {
        setError(data.message || 'Failed to assign asset')
      }
    } catch (err) {
      setError('Failed to assign asset')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAsset = async (asset: Asset) => {
    if (!selectedAdmin) return

    if (!confirm(`Are you sure you want to delete this asset?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/admins/${selectedAdmin.id}/assets/${asset.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSuccess('Asset deleted successfully')
        loadAdminAssets(selectedAdmin.id)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to delete asset')
      }
    } catch (err) {
      setError('Failed to delete asset')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAssetStatus = async (asset: Asset) => {
    if (!selectedAdmin) return

    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/admins/${selectedAdmin.id}/assets/${asset.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !asset.is_active
        })
      })
      
      if (response.ok) {
        setSuccess(`Asset ${!asset.is_active ? 'activated' : 'deactivated'} successfully`)
        loadAdminAssets(selectedAdmin.id)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update asset status')
      }
    } catch (err) {
      setError('Failed to update asset status')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedAdmin(null)
    setError('')
    setSuccess('')
  }

  const handleAddAsset = () => {
    setViewMode('add')
  }

  const handleEditAsset = (asset: Asset) => {
    setViewMode('edit')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-2">
            Manage admin accounts and their multimedia assets
          </p>
        </div>
        {viewMode === 'list' && (
          <Button onClick={handleAddAdmin} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Admin
          </Button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      {viewMode !== 'list' && (
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin List
          </Button>
          {viewMode === 'assets' && selectedAdmin && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Managing assets for: <strong>{selectedAdmin.full_name}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Loading...</span>
        </div>
      )}

      {!loading && (
        <>
          {viewMode === 'list' && (
            <AdminList
              admins={admins}
              loading={loading}
              onAddAdmin={handleAddAdmin}
              onEditAdmin={handleEditAdmin}
              onViewAdmin={handleViewAdmin}
              onDeleteAdmin={handleDeleteAdmin}
              onToggleStatus={handleToggleStatus}
              onManageAssets={handleManageAssets}
            />
          )}

          {(viewMode === 'add' || viewMode === 'edit') && (
            <AdminForm
              admin={selectedAdmin || undefined}
              onSubmit={handleSubmitAdmin}
              onCancel={handleCancel}
              loading={loading}
            />
          )}

          {viewMode === 'assets' && selectedAdmin && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Assets for {selectedAdmin.full_name}
                  </CardTitle>
                  <CardDescription>
                    Manage multimedia assets assigned to this admin. Each admin gets default assets when created.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <Button onClick={handleAddAsset} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Assign New Asset
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => loadAdminAssets(selectedAdmin.id)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Refresh Assets
                    </Button>
                  </div>
                  
                  <AssetList
                    adminId={selectedAdmin.id}
                    adminName={selectedAdmin.full_name}
                    assets={adminAssets}
                    loading={loading}
                    onAddAsset={handleAddAsset}
                    onEditAsset={handleEditAsset}
                    onDeleteAsset={handleDeleteAsset}
                    onToggleAssetStatus={handleToggleAssetStatus}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

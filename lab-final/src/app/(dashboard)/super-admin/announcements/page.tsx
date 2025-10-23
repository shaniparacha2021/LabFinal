'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Megaphone, Plus, Settings, BarChart3 } from 'lucide-react'
import AnnouncementList from '@/components/announcements/announcement-list'
import AnnouncementForm from '@/components/announcements/announcement-form'

type ViewMode = 'list' | 'create' | 'edit' | 'view'

export default function AnnouncementsManagementPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleCreate = () => {
    setSelectedAnnouncement(null)
    setViewMode('create')
  }

  const handleEdit = (announcement: any) => {
    setSelectedAnnouncement(announcement)
    setViewMode('edit')
  }

  const handleView = (id: string) => {
    // TODO: Implement view details modal
    console.log('View announcement:', id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/announcements/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the list
        window.location.reload()
      } else {
        alert('Failed to delete announcement: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('Failed to delete announcement')
    } finally {
      setLoading(false)
    }
  }

  const handleBroadcast = async (id: string) => {
    if (!confirm('Are you sure you want to broadcast this announcement to all admins?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/super-admin/announcements/${id}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broadcastType: 'IMMEDIATE' })
      })

      const data = await response.json()

      if (data.success) {
        alert('Announcement broadcasted successfully!')
        // Refresh the list
        window.location.reload()
      } else {
        alert('Failed to broadcast announcement: ' + data.message)
      }
    } catch (error) {
      console.error('Error broadcasting announcement:', error)
      alert('Failed to broadcast announcement')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData: any) => {
    try {
      setLoading(true)
      
      const url = viewMode === 'create' 
        ? '/api/super-admin/announcements'
        : `/api/super-admin/announcements/${selectedAnnouncement.id}`
      
      const method = viewMode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        alert(viewMode === 'create' ? 'Announcement created successfully!' : 'Announcement updated successfully!')
        setViewMode('list')
        setSelectedAnnouncement(null)
        // Refresh the list
        window.location.reload()
      } else {
        alert('Failed to save announcement: ' + data.message)
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      alert('Failed to save announcement')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedAnnouncement(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Megaphone className="h-8 w-8 text-blue-600" />
            <span>Announcements & Broadcasts</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Manage system-wide announcements and broadcasts for all admin dashboards
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/super-admin/dashboard')}
          >
            Back to Dashboard
          </Button>
          {viewMode === 'list' && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'list' && (
        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList>
            <TabsTrigger value="announcements" className="flex items-center space-x-2">
              <Megaphone className="h-4 w-4" />
              <span>Announcements</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="space-y-6">
            <AnnouncementList
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBroadcast={handleBroadcast}
              onView={handleView}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Announcement Analytics</CardTitle>
                <CardDescription>
                  View detailed analytics and engagement metrics for your announcements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Analytics dashboard coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Announcement Settings</CardTitle>
                <CardDescription>
                  Configure announcement preferences and notification settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Settings panel coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create/Edit Form */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <AnnouncementForm
          announcement={selectedAnnouncement}
          onSave={handleSave}
          onCancel={handleCancel}
          mode={viewMode}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Save, X, Megaphone, AlertTriangle, Pin } from 'lucide-react'
import { format } from 'date-fns'

interface AnnouncementFormProps {
  announcement?: any
  onSave: (data: any) => void
  onCancel: () => void
  mode: 'create' | 'edit'
}

export default function AnnouncementForm({
  announcement,
  onSave,
  onCancel,
  mode
}: AnnouncementFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    announcementType: 'GENERAL_NOTICES',
    imageUrl: '',
    linkUrl: '',
    linkText: '',
    visibilityStartDate: new Date(),
    visibilityEndDate: null as Date | null,
    isUrgent: false,
    isPinned: false,
    notificationType: 'BANNER',
    targetAudience: ['ALL'],
    status: 'DRAFT',
    broadcastImmediately: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (announcement && mode === 'edit') {
      setFormData({
        title: announcement.title || '',
        description: announcement.description || '',
        announcementType: announcement.announcement_type || 'GENERAL_NOTICES',
        imageUrl: announcement.image_url || '',
        linkUrl: announcement.link_url || '',
        linkText: announcement.link_text || '',
        visibilityStartDate: announcement.visibility_start_date ? new Date(announcement.visibility_start_date) : new Date(),
        visibilityEndDate: announcement.visibility_end_date ? new Date(announcement.visibility_end_date) : null,
        isUrgent: announcement.is_urgent || false,
        isPinned: announcement.is_pinned || false,
        notificationType: announcement.notification_type || 'BANNER',
        targetAudience: announcement.target_audience || ['ALL'],
        status: announcement.status || 'DRAFT',
        broadcastImmediately: false
      })
    }
  }, [announcement, mode])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.visibilityEndDate && formData.visibilityEndDate <= formData.visibilityStartDate) {
      newErrors.visibilityEndDate = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        visibilityStartDate: formData.visibilityStartDate.toISOString(),
        visibilityEndDate: formData.visibilityEndDate?.toISOString() || null
      }
      
      await onSave(submitData)
    } catch (error) {
      console.error('Error saving announcement:', error)
    } finally {
      setLoading(false)
    }
  }

  const announcementTypes = [
    { value: 'SYSTEM_UPDATES', label: 'System Updates', description: 'Updates about system features and improvements' },
    { value: 'MAINTENANCE_ALERTS', label: 'Maintenance Alerts', description: 'Scheduled maintenance and downtime notifications' },
    { value: 'NEW_FEATURE_RELEASES', label: 'New Feature Releases', description: 'Announcements about new features and capabilities' },
    { value: 'SUBSCRIPTION_OFFERS', label: 'Subscription Offers', description: 'Special offers and subscription updates' },
    { value: 'GENERAL_NOTICES', label: 'General Notices', description: 'General information and announcements' }
  ]

  const notificationTypes = [
    { value: 'BANNER', label: 'Banner', description: 'Display as banner notification' },
    { value: 'POPUP', label: 'Popup', description: 'Display as popup notification' },
    { value: 'BOTH', label: 'Both', description: 'Display as both banner and popup' }
  ]

  const targetAudiences = [
    { value: 'ALL', label: 'All Users' },
    { value: 'SUPER_ADMIN', label: 'Super Admins Only' },
    { value: 'ADMIN', label: 'Admins Only' },
    { value: 'TENANT_ADMIN', label: 'Tenant Admins Only' }
  ]

  const statuses = [
    { value: 'DRAFT', label: 'Draft', description: 'Save as draft for later editing' },
    { value: 'ACTIVE', label: 'Active', description: 'Make announcement active and visible' },
    { value: 'ARCHIVED', label: 'Archived', description: 'Archive the announcement' }
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Megaphone className="h-5 w-5" />
          <span>{mode === 'create' ? 'Create New Announcement' : 'Edit Announcement'}</span>
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Create a new system-wide announcement for all admin dashboards'
            : 'Update the announcement details and settings'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcementType">Announcement Type *</Label>
                <Select
                  value={formData.announcementType}
                  onValueChange={(value) => setFormData({ ...formData, announcementType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select announcement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {announcementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter announcement description"
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>
          </div>

          {/* Media and Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Media and Links</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkUrl">Link URL</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkText">Link Text</Label>
              <Input
                id="linkText"
                value={formData.linkText}
                onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                placeholder="Learn More"
              />
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Visibility Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.visibilityStartDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.visibilityStartDate}
                      onSelect={(date) => date && setFormData({ ...formData, visibilityStartDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.visibilityEndDate ? format(formData.visibilityEndDate, 'PPP') : 'No end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.visibilityEndDate || undefined}
                      onSelect={(date) => setFormData({ ...formData, visibilityEndDate: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.visibilityEndDate && <p className="text-sm text-red-500">{errors.visibilityEndDate}</p>}
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notificationType">Notification Type</Label>
                <Select
                  value={formData.notificationType}
                  onValueChange={(value) => setFormData({ ...formData, notificationType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select
                  value={formData.targetAudience[0]}
                  onValueChange={(value) => setFormData({ ...formData, targetAudience: [value] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetAudiences.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Priority Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Priority Settings</h3>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isUrgent"
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) => setFormData({ ...formData, isUrgent: checked })}
                />
                <Label htmlFor="isUrgent" className="flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span>Urgent</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPinned"
                  checked={formData.isPinned}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
                />
                <Label htmlFor="isPinned" className="flex items-center space-x-1">
                  <Pin className="h-4 w-4 text-yellow-500" />
                  <span>Pinned</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status and Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div>
                          <div className="font-medium">{status.label}</div>
                          <div className="text-sm text-gray-500">{status.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'ACTIVE' && (
                <div className="space-y-2">
                  <Label htmlFor="broadcastImmediately">Broadcast Options</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="broadcastImmediately"
                      checked={formData.broadcastImmediately}
                      onCheckedChange={(checked) => setFormData({ ...formData, broadcastImmediately: checked })}
                    />
                    <Label htmlFor="broadcastImmediately">Broadcast immediately</Label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : mode === 'create' ? 'Create Announcement' : 'Update Announcement'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

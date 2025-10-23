'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  X, 
  AlertTriangle, 
  Pin, 
  ExternalLink, 
  Megaphone,
  Calendar,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'

interface Announcement {
  announcement_id: string
  title: string
  description: string
  announcement_type: 'SYSTEM_UPDATES' | 'MAINTENANCE_ALERTS' | 'NEW_FEATURE_RELEASES' | 'SUBSCRIPTION_OFFERS' | 'GENERAL_NOTICES'
  image_url?: string
  banner_file_name?: string
  banner_github_path?: string
  link_url?: string
  link_text?: string
  is_urgent: boolean
  is_pinned: boolean
  notification_type: 'POPUP' | 'BANNER' | 'BOTH'
  is_viewed: boolean
  is_dismissed: boolean
  viewed_at?: string
  dismissed_at?: string
}

interface AdminAnnouncementBannerProps {
  adminId: string
  onAnnouncementViewed?: (announcementId: string) => void
  onAnnouncementDismissed?: (announcementId: string) => void
}

export default function AdminAnnouncementBanner({
  adminId,
  onAnnouncementViewed,
  onAnnouncementDismissed
}: AdminAnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set())

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/announcements?includeViewed=false&includeDismissed=false')
      const data = await response.json()

      if (data.success) {
        setAnnouncements(data.data.announcements || [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
    
    // Refresh announcements every 30 seconds
    const interval = setInterval(fetchAnnouncements, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsViewed = async (announcementId: string) => {
    try {
      await fetch(`/api/admin/announcements/${announcementId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewType: 'BANNER' })
      })
      
      onAnnouncementViewed?.(announcementId)
    } catch (error) {
      console.error('Error marking announcement as viewed:', error)
    }
  }

  const dismissAnnouncement = async (announcementId: string) => {
    try {
      await fetch(`/api/admin/announcements/${announcementId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewType: 'BANNER' })
      })
      
      setDismissedAnnouncements(prev => new Set([...prev, announcementId]))
      onAnnouncementDismissed?.(announcementId)
    } catch (error) {
      console.error('Error dismissing announcement:', error)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SYSTEM_UPDATES': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'MAINTENANCE_ALERTS': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'NEW_FEATURE_RELEASES': return 'bg-green-100 text-green-800 border-green-200'
      case 'SUBSCRIPTION_OFFERS': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'GENERAL_NOTICES': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SYSTEM_UPDATES': return <Megaphone className="h-4 w-4" />
      case 'MAINTENANCE_ALERTS': return <AlertTriangle className="h-4 w-4" />
      case 'NEW_FEATURE_RELEASES': return <Megaphone className="h-4 w-4" />
      case 'SUBSCRIPTION_OFFERS': return <Megaphone className="h-4 w-4" />
      case 'GENERAL_NOTICES': return <Megaphone className="h-4 w-4" />
      default: return <Megaphone className="h-4 w-4" />
    }
  }

  if (loading) {
    return null
  }

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.has(announcement.announcement_id)
  )

  if (visibleAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mb-6">
      {visibleAnnouncements.map((announcement) => (
        <Card 
          key={announcement.announcement_id}
          className={`border-l-4 ${
            announcement.is_urgent 
              ? 'border-l-red-500 bg-red-50' 
              : announcement.is_pinned 
                ? 'border-l-yellow-500 bg-yellow-50'
                : 'border-l-blue-500 bg-blue-50'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {announcement.is_pinned && (
                    <Pin className="h-4 w-4 text-yellow-600" />
                  )}
                  {announcement.is_urgent && (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge 
                    variant="outline" 
                    className={`${getTypeColor(announcement.announcement_type)} flex items-center space-x-1`}
                  >
                    {getTypeIcon(announcement.announcement_type)}
                    <span>{announcement.announcement_type.replace(/_/g, ' ')}</span>
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
                
                <p className="text-gray-700 mb-3">{announcement.description}</p>
                
                {(announcement.image_url || announcement.banner_github_path) && (
                  <div className="mb-3">
                    <img 
                      src={announcement.banner_github_path || announcement.image_url} 
                      alt={announcement.title}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Posted {format(new Date(), 'MMM dd, yyyy')}</span>
                  </div>
                  {announcement.notification_type === 'POPUP' && (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Popup Notification</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                {announcement.link_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      markAsViewed(announcement.announcement_id)
                      window.open(announcement.link_url, '_blank')
                    }}
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{announcement.link_text || 'Learn More'}</span>
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAnnouncement(announcement.announcement_id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

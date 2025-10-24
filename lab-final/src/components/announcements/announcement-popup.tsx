'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  AlertTriangle, 
  Pin, 
  ExternalLink, 
  Megaphone,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'

interface Announcement {
  announcement_id: string
  title: string
  description: string
  announcement_type: 'SYSTEM_UPDATES' | 'MAINTENANCE_ALERTS' | 'NEW_FEATURE_RELEASES' | 'SUBSCRIPTION_OFFERS' | 'GENERAL_NOTICES'
  image_url?: string
  link_url?: string
  link_text?: string
  is_urgent: boolean
  is_pinned: boolean
  notification_type: 'POPUP' | 'BANNER' | 'BOTH'
  is_viewed: boolean
  is_dismissed: boolean
}

interface AnnouncementPopupProps {
  adminId: string
  onAnnouncementViewed?: (announcementId: string) => void
  onAnnouncementDismissed?: (announcementId: string) => void
}

export default function AnnouncementPopup({
  adminId,
  onAnnouncementViewed,
  onAnnouncementDismissed
}: AnnouncementPopupProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/announcements?includeViewed=false&includeDismissed=false')
      const data = await response.json()

      if (data.success) {
        // Filter for popup notifications only
        const popupAnnouncements = data.data.announcements.filter(
          (announcement: Announcement) => 
            announcement.notification_type === 'POPUP' || announcement.notification_type === 'BOTH'
        )
        setAnnouncements(popupAnnouncements)
        
        // Show popup if there are urgent announcements or any popup announcements
        if (popupAnnouncements.length > 0) {
          setIsVisible(true)
        }
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
        body: JSON.stringify({ viewType: 'POPUP' })
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
        body: JSON.stringify({ viewType: 'POPUP' })
      })
      
      onAnnouncementDismissed?.(announcementId)
      nextAnnouncement()
    } catch (error) {
      console.error('Error dismissing announcement:', error)
    }
  }

  const nextAnnouncement = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setIsVisible(false)
    }
  }

  const closePopup = () => {
    setIsVisible(false)
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

  if (loading || !isVisible || announcements.length === 0) {
    return null
  }

  const currentAnnouncement = announcements[currentIndex]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentAnnouncement.is_pinned && (
                <Pin className="h-4 w-4 text-yellow-600" />
              )}
              {currentAnnouncement.is_urgent && (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <Badge 
                variant="outline" 
                className={`${getTypeColor(currentAnnouncement.announcement_type)} flex items-center space-x-1`}
              >
                {getTypeIcon(currentAnnouncement.announcement_type)}
                <span>{currentAnnouncement.announcement_type.replace(/_/g, ' ')}</span>
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closePopup}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <CardTitle className="text-lg mb-2">{currentAnnouncement.title}</CardTitle>
            <p className="text-gray-700">{currentAnnouncement.description}</p>
          </div>
          
          {currentAnnouncement.image_url && (
            <div>
              <img 
                src={currentAnnouncement.image_url} 
                alt={currentAnnouncement.title}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Posted {format(new Date(), 'MMM dd, yyyy')}</span>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-500">
              {currentIndex + 1} of {announcements.length}
            </div>
            
            <div className="flex space-x-2">
              {currentAnnouncement.link_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    markAsViewed(currentAnnouncement.announcement_id)
                    window.open(currentAnnouncement.link_url, '_blank')
                  }}
                  className="flex items-center space-x-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{currentAnnouncement.link_text || 'Learn More'}</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => dismissAnnouncement(currentAnnouncement.announcement_id)}
              >
                Dismiss
              </Button>
              
              {currentIndex < announcements.length - 1 && (
                <Button
                  size="sm"
                  onClick={nextAnnouncement}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

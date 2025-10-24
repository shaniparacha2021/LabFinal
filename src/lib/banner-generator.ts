// Banner Generator for Announcements
// Generates SVG banner images for announcements and saves them to GitHub

export interface BannerConfig {
  title: string
  description: string
  type: 'SYSTEM_UPDATES' | 'MAINTENANCE_ALERTS' | 'NEW_FEATURE_RELEASES' | 'SUBSCRIPTION_OFFERS' | 'GENERAL_NOTICES'
  isUrgent: boolean
  isPinned: boolean
  width?: number
  height?: number
}

export function generateBannerSVG(config: BannerConfig): string {
  const { title, description, type, isUrgent, isPinned, width = 800, height = 200 } = config
  
  // Get colors based on type and urgency
  const getColors = () => {
    if (isUrgent) {
      return {
        background: '#fef2f2',
        border: '#dc2626',
        title: '#dc2626',
        description: '#7f1d1d',
        accent: '#fca5a5'
      }
    }
    
    if (isPinned) {
      return {
        background: '#fffbeb',
        border: '#d97706',
        title: '#d97706',
        description: '#92400e',
        accent: '#fcd34d'
      }
    }
    
    switch (type) {
      case 'SYSTEM_UPDATES':
        return {
          background: '#eff6ff',
          border: '#2563eb',
          title: '#1e40af',
          description: '#1e3a8a',
          accent: '#93c5fd'
        }
      case 'MAINTENANCE_ALERTS':
        return {
          background: '#fff7ed',
          border: '#ea580c',
          title: '#c2410c',
          description: '#9a3412',
          accent: '#fdba74'
        }
      case 'NEW_FEATURE_RELEASES':
        return {
          background: '#f0fdf4',
          border: '#16a34a',
          title: '#15803d',
          description: '#166534',
          accent: '#86efac'
        }
      case 'SUBSCRIPTION_OFFERS':
        return {
          background: '#faf5ff',
          border: '#9333ea',
          title: '#7c3aed',
          description: '#6b21a8',
          accent: '#c4b5fd'
        }
      default: // GENERAL_NOTICES
        return {
          background: '#f9fafb',
          border: '#6b7280',
          title: '#374151',
          description: '#4b5563',
          accent: '#d1d5db'
        }
    }
  }
  
  const colors = getColors()
  
  // Get type icon
  const getTypeIcon = () => {
    switch (type) {
      case 'SYSTEM_UPDATES':
        return '🔧'
      case 'MAINTENANCE_ALERTS':
        return '⚠️'
      case 'NEW_FEATURE_RELEASES':
        return '✨'
      case 'SUBSCRIPTION_OFFERS':
        return '💎'
      default:
        return '📢'
    }
  }
  
  // Truncate text to fit
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }
  
  const truncatedTitle = truncateText(title, 50)
  const truncatedDescription = truncateText(description, 80)
  
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.background};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:0.3" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)" stroke="${colors.border}" stroke-width="3" rx="12"/>
  
  <!-- Urgent indicator -->
  ${isUrgent ? `
    <rect x="10" y="10" width="8" height="${height - 20}" fill="${colors.border}" rx="4"/>
    <text x="20" y="${height/2 + 5}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" transform="rotate(-90 20 ${height/2})">URGENT</text>
  ` : ''}
  
  <!-- Pinned indicator -->
  ${isPinned ? `
    <circle cx="${width - 30}" cy="30" r="15" fill="${colors.border}"/>
    <text x="${width - 30}" y="35" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">📌</text>
  ` : ''}
  
  <!-- Type icon -->
  <text x="${isUrgent ? 50 : 20}" y="50" font-family="Arial, sans-serif" font-size="24">${getTypeIcon()}</text>
  
  <!-- Title -->
  <text x="${isUrgent ? 90 : 60}" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${colors.title}">${truncatedTitle}</text>
  
  <!-- Description -->
  <text x="${isUrgent ? 90 : 60}" y="70" font-family="Arial, sans-serif" font-size="14" fill="${colors.description}">${truncatedDescription}</text>
  
  <!-- Type label -->
  <rect x="${width - 150}" y="${height - 35}" width="140" height="25" fill="${colors.border}" rx="12"/>
  <text x="${width - 80}" y="${height - 20}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">${type.replace(/_/g, ' ')}</text>
  
  <!-- Timestamp -->
  <text x="20" y="${height - 10}" font-family="Arial, sans-serif" font-size="10" fill="${colors.description}">${new Date().toLocaleDateString()}</text>
</svg>`.trim()
}

export function generateBannerFileName(announcementId: string, type: string): string {
  const timestamp = new Date().toISOString().split('T')[0]
  return `announcement-banner-${announcementId}-${type.toLowerCase()}-${timestamp}.svg`
}

export function getBannerGitHubPath(fileName: string): string {
  return `assets/images/announcements/banners/${fileName}`
}

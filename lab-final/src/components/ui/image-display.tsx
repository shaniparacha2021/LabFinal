'use client'

import { useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { getAssetUrl } from '@/lib/file-utils'

interface ImageDisplayProps {
  filename: string
  type: 'IMAGES' | 'BRANDING' | 'UPLOADS'
  alt: string
  className?: string
  width?: number
  height?: number
  showRemove?: boolean
  onRemove?: () => void
}

export function ImageDisplay({
  filename,
  type,
  alt,
  className = '',
  width,
  height,
  showRemove = false,
  onRemove
}: ImageDisplayProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const imageUrl = getAssetUrl(type, filename)

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Image not found</p>
          <p className="text-xs text-gray-400">{filename}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative group ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 rounded-lg ${className}`}
      />
      
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Avatar component for user/doctor photos
interface AvatarProps {
  filename?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ filename, name, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg'
  }

  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (filename) {
    return (
      <ImageDisplay
        filename={filename}
        type="IMAGES"
        alt={name}
        className={`rounded-full ${sizeClasses[size]} ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold ${className}`}>
      {initials}
    </div>
  )
}

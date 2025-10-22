import { join } from 'path'

// File storage paths
export const ASSETS_PATHS = {
  IMAGES: '/assets/images',
  REPORTS: '/assets/reports',
  BRANDING: '/assets/branding',
  TEMPLATES: '/assets/templates',
  UPLOADS: '/assets/uploads',
} as const

// File type categories
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  PDF: ['pdf'],
  DOCUMENT: ['doc', 'docx', 'txt'],
  EXCEL: ['xls', 'xlsx', 'csv'],
} as const

// Generate unique filename
export function generateUniqueFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const name = originalName.split('.').slice(0, -1).join('.')
  
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_')
  const uniqueName = `${prefix ? prefix + '_' : ''}${cleanName}_${timestamp}_${random}.${extension}`
  
  return uniqueName
}

// Get file path for different asset types
export function getAssetPath(type: keyof typeof ASSETS_PATHS, filename: string): string {
  return `${ASSETS_PATHS[type]}/${filename}`
}

// Get full URL for asset
export function getAssetUrl(type: keyof typeof ASSETS_PATHS, filename: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}${getAssetPath(type, filename)}`
}

// Validate file type
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

// Get file size in human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// File upload validation
export interface FileUploadValidation {
  isValid: boolean
  error?: string
}

export function validateFileUpload(
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB default
  allowedTypes: string[] = FILE_TYPES.IMAGE
): FileUploadValidation {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${formatFileSize(maxSize)}`
    }
  }
  
  // Check file type
  if (!validateFileType(file.name, allowedTypes)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }
  
  return { isValid: true }
}

// Asset management functions
export class AssetManager {
  static async uploadFile(
    file: File,
    type: keyof typeof ASSETS_PATHS,
    prefix?: string
  ): Promise<{ filename: string; path: string; url: string }> {
    // Generate unique filename
    const filename = generateUniqueFilename(file.name, prefix)
    
    // Validate file
    const validation = validateFileUpload(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }
    
    // In a real application, you would save the file to the filesystem here
    // For now, we'll just return the filename and path
    const path = getAssetPath(type, filename)
    const url = getAssetUrl(type, filename)
    
    return { filename, path, url }
  }
  
  static getAssetUrl(type: keyof typeof ASSETS_PATHS, filename: string): string {
    return getAssetUrl(type, filename)
  }
  
  static getAssetPath(type: keyof typeof ASSETS_PATHS, filename: string): string {
    return getAssetPath(type, filename)
  }
}

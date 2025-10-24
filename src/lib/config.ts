// Application Configuration
export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Lab Management System',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  
  database: {
    url: process.env.DATABASE_URL!,
  },
  
  auth: {
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    nextAuthSecret: process.env.NEXTAUTH_SECRET!,
  },
  
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,gif,webp,svg').split(','),
    allowedDocumentTypes: (process.env.ALLOWED_DOCUMENT_TYPES || 'pdf,doc,docx,txt').split(','),
  },
  
  // Asset paths
  assets: {
    images: '/assets/images',
    reports: '/assets/reports',
    branding: '/assets/branding',
    templates: '/assets/templates',
    uploads: '/assets/uploads',
  },
  
  // User roles
  roles: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    USER: 'USER',
  },
  
  // Subscription types
  subscriptions: {
    TRIAL: 'TRIAL',
    MONTHLY: 'MONTHLY',
    ANNUAL: 'ANNUAL',
    LIFETIME: 'LIFETIME',
  },
  
  // Report statuses
  reportStatus: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
} as const

// Validate required environment variables
export function validateConfig() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

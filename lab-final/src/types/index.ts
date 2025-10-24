// User Types
export interface User {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  tenant_id?: string
  created_at: string
  updated_at: string
}

// Tenant Types
export interface Tenant {
  id: string
  name: string
  slug: string
  subscription_type: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME'
  subscription_status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED'
  features: string[]
  // Branding assets stored as file names
  logo_filename?: string
  header_filename?: string
  footer_filename?: string
  watermark_filename?: string
  created_at: string
  updated_at: string
}

// Patient Types
export interface Patient {
  id: string
  tenant_id: string
  name: string
  email?: string
  phone?: string
  age?: number
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  // Patient photo stored as file name
  photo_filename?: string
  created_at: string
  updated_at: string
}

// Test Types
export interface Test {
  id: string
  tenant_id: string
  name: string
  description?: string
  price: number
  parameters: TestParameter[]
  created_at: string
  updated_at: string
}

export interface TestParameter {
  id: string
  name: string
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT'
  options?: string[]
  required: boolean
  unit?: string
  normal_range?: string
}

// Report Types
export interface Report {
  id: string
  tenant_id: string
  patient_id: string
  test_id: string
  results: Record<string, any>
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  // Report files stored as file names
  pdf_filename?: string
  created_at: string
  updated_at: string
}

// Doctor Types
export interface Doctor {
  id: string
  tenant_id: string
  name: string
  specialization: string
  commission_rate: number
  phone?: string
  email?: string
  // Doctor photo stored as file name
  photo_filename?: string
  created_at: string
  updated_at: string
}

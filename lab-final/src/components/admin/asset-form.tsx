'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Image, Upload, Link, FileText } from 'lucide-react'

interface AssetFormProps {
  adminId: string
  adminName: string
  assetType?: 'header_image' | 'footer_image' | 'watermark_image'
  existingAsset?: {
    id: string
    asset_type: string
    asset_name: string
    file_path: string
    github_url?: string
    file_size?: number
    mime_type?: string
  }
  onSubmit: (data: AssetFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export interface AssetFormData {
  asset_type: 'header_image' | 'footer_image' | 'watermark_image'
  asset_name: string
  file_path: string
  github_url?: string
  file_size?: number
  mime_type?: string
}

const ASSET_TYPES = [
  { value: 'header_image', label: 'Header Image', description: 'Main header image for the lab interface' },
  { value: 'footer_image', label: 'Footer Image', description: 'Footer image for the lab interface' },
  { value: 'watermark_image', label: 'Watermark Image', description: 'Watermark overlay for lab content' }
]

export function AssetForm({ 
  adminId, 
  adminName, 
  assetType, 
  existingAsset, 
  onSubmit, 
  onCancel, 
  loading = false 
}: AssetFormProps) {
  const [formData, setFormData] = useState<AssetFormData>({
    asset_type: assetType || existingAsset?.asset_type || 'header_image',
    asset_name: existingAsset?.asset_name || '',
    file_path: existingAsset?.file_path || '',
    github_url: existingAsset?.github_url || '',
    file_size: existingAsset?.file_size,
    mime_type: existingAsset?.mime_type || ''
  })
  
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.asset_name.trim()) {
      setError('Asset name is required')
      return
    }
    if (!formData.file_path.trim()) {
      setError('File path is required')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleInputChange = (field: keyof AssetFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getAssetTypeInfo = (type: string) => {
    return ASSET_TYPES.find(t => t.value === type) || ASSET_TYPES[0]
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          {existingAsset ? 'Edit Asset' : 'Assign Asset'}
        </CardTitle>
        <CardDescription>
          {existingAsset 
            ? `Update asset information for ${adminName}`
            : `Assign a new asset to ${adminName}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Asset Type */}
          <div className="space-y-2">
            <Label htmlFor="asset_type">Asset Type *</Label>
            <Select
              value={formData.asset_type}
              onValueChange={(value: 'header_image' | 'footer_image' | 'watermark_image') => 
                handleInputChange('asset_type', value)
              }
              disabled={loading || !!existingAsset}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {existingAsset && (
              <p className="text-sm text-gray-500">
                Asset type cannot be changed after creation
              </p>
            )}
          </div>

          {/* Asset Name */}
          <div className="space-y-2">
            <Label htmlFor="asset_name">Asset Name *</Label>
            <Input
              id="asset_name"
              type="text"
              placeholder={`Enter ${getAssetTypeInfo(formData.asset_type).label.toLowerCase()} name`}
              value={formData.asset_name}
              onChange={(e) => handleInputChange('asset_name', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* File Path */}
          <div className="space-y-2">
            <Label htmlFor="file_path">File Path *</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="file_path"
                type="text"
                placeholder="e.g., assets/images/header-lab-1.png"
                value={formData.file_path}
                onChange={(e) => handleInputChange('file_path', e.target.value)}
                required
                disabled={loading}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-gray-500">
              Relative path to the asset file in the repository
            </p>
          </div>

          {/* GitHub URL */}
          <div className="space-y-2">
            <Label htmlFor="github_url">GitHub URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="github_url"
                type="url"
                placeholder="https://github.com/username/repo/blob/main/assets/..."
                value={formData.github_url}
                onChange={(e) => handleInputChange('github_url', e.target.value)}
                disabled={loading}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-gray-500">
              Optional: Direct link to the asset in GitHub
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Size */}
            <div className="space-y-2">
              <Label htmlFor="file_size">File Size (bytes)</Label>
              <Input
                id="file_size"
                type="number"
                placeholder="e.g., 1024000"
                value={formData.file_size || ''}
                onChange={(e) => handleInputChange('file_size', parseInt(e.target.value) || 0)}
                disabled={loading}
              />
            </div>

            {/* MIME Type */}
            <div className="space-y-2">
              <Label htmlFor="mime_type">MIME Type</Label>
              <Input
                id="mime_type"
                type="text"
                placeholder="e.g., image/png, image/jpeg"
                value={formData.mime_type}
                onChange={(e) => handleInputChange('mime_type', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Asset Preview */}
          {formData.file_path && (
            <div className="space-y-2">
              <Label>Asset Preview</Label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Type:</strong> {getAssetTypeInfo(formData.asset_type).label}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Name:</strong> {formData.asset_name || 'Not specified'}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Path:</strong> {formData.file_path}
                </div>
                {formData.github_url && (
                  <div className="text-sm text-gray-600">
                    <strong>GitHub:</strong> 
                    <a 
                      href={formData.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      View in GitHub
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingAsset ? 'Update Asset' : 'Assign Asset'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

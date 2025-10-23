'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Image,
  ExternalLink,
  CheckCircle,
  XCircle,
  FileText,
  Calendar
} from 'lucide-react'

interface Asset {
  id: string
  asset_type: 'header_image' | 'footer_image' | 'watermark_image'
  asset_name: string
  file_path: string
  github_url?: string
  file_size?: number
  mime_type?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AssetListProps {
  adminId: string
  adminName: string
  assets: Asset[]
  loading?: boolean
  onAddAsset: () => void
  onEditAsset: (asset: Asset) => void
  onDeleteAsset: (asset: Asset) => void
  onToggleAssetStatus: (asset: Asset) => void
}

const ASSET_TYPE_LABELS = {
  header_image: 'Header Image',
  footer_image: 'Footer Image',
  watermark_image: 'Watermark Image'
}

const ASSET_TYPE_COLORS = {
  header_image: 'bg-blue-100 text-blue-800',
  footer_image: 'bg-green-100 text-green-800',
  watermark_image: 'bg-purple-100 text-purple-800'
}

export function AssetList({ 
  adminId, 
  adminName, 
  assets, 
  loading = false, 
  onAddAsset, 
  onEditAsset, 
  onDeleteAsset, 
  onToggleAssetStatus 
}: AssetListProps) {
  const [filterType, setFilterType] = useState<'all' | 'header_image' | 'footer_image' | 'watermark_image'>('all')

  // Filter assets based on type
  const filteredAssets = assets.filter(asset => 
    filterType === 'all' || asset.asset_type === filterType
  )

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAssetTypeCount = (type: string) => {
    return assets.filter(asset => asset.asset_type === type).length
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Assets for {adminName}
            </CardTitle>
            <CardDescription>
              Manage multimedia assets assigned to this admin
            </CardDescription>
          </div>
          <Button onClick={onAddAsset} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Assign Asset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter by Asset Type */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            All ({assets.length})
          </Button>
          <Button
            variant={filterType === 'header_image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('header_image')}
          >
            Header ({getAssetTypeCount('header_image')})
          </Button>
          <Button
            variant={filterType === 'footer_image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('footer_image')}
          >
            Footer ({getAssetTypeCount('footer_image')})
          </Button>
          <Button
            variant={filterType === 'watermark_image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('watermark_image')}
          >
            Watermark ({getAssetTypeCount('watermark_image')})
          </Button>
        </div>

        {/* Assets Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading assets...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterType !== 'all' ? 'No assets of this type' : 'No assets assigned'}
            </h3>
            <p className="text-gray-500 mb-4">
              {filterType !== 'all' 
                ? `No ${ASSET_TYPE_LABELS[filterType].toLowerCase()} assets found`
                : 'This admin has no multimedia assets assigned yet'
              }
            </p>
            <Button onClick={onAddAsset}>
              <Plus className="h-4 w-4 mr-2" />
              Assign First Asset
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>File Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{asset.asset_name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {asset.file_path}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ASSET_TYPE_COLORS[asset.asset_type]}>
                        {ASSET_TYPE_LABELS[asset.asset_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {asset.mime_type && (
                          <div className="text-gray-600">{asset.mime_type}</div>
                        )}
                        {asset.file_size && (
                          <div className="text-gray-500">{formatFileSize(asset.file_size)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {asset.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={asset.is_active ? 'default' : 'secondary'}>
                          {asset.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(asset.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {asset.github_url && (
                            <DropdownMenuItem asChild>
                              <a 
                                href={asset.github_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center w-full"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View in GitHub
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onEditAsset(asset)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Asset
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleAssetStatus(asset)}>
                            {asset.is_active ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteAsset(asset)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Results Summary */}
        {filteredAssets.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>
        )}
      </CardContent>
    </Card>
  )
}

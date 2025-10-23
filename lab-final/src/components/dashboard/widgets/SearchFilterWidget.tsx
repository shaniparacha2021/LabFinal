'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, RefreshCw } from 'lucide-react'

interface FilterOption {
  key: string
  label: string
  options: Array<{
    value: string
    label: string
  }>
}

interface SearchFilterWidgetProps {
  title: string
  description?: string
  searchPlaceholder?: string
  filters: FilterOption[]
  onSearch: (searchTerm: string) => void
  onFilter: (filters: Record<string, string>) => void
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onRefresh: () => void
  sortOptions?: Array<{
    value: string
    label: string
  }>
  activeFilters?: Record<string, string>
  searchTerm?: string
}

export default function SearchFilterWidget({
  title,
  description,
  searchPlaceholder = "Search...",
  filters,
  onSearch,
  onFilter,
  onSort,
  onRefresh,
  sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'name', label: 'Name' },
    { value: 'status', label: 'Status' },
    { value: 'updated_at', label: 'Last Updated' }
  ],
  activeFilters = {},
  searchTerm = ''
}: SearchFilterWidgetProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [localFilters, setLocalFilters] = useState<Record<string, string>>(activeFilters)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSearch = () => {
    onSearch(localSearchTerm)
  }

  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...localFilters, [filterKey]: value }
    setLocalFilters(newFilters)
    onFilter(newFilters)
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    onSort(newSortBy, sortOrder)
  }

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(newOrder)
    onSort(sortBy, newOrder)
  }

  const clearFilter = (filterKey: string) => {
    const newFilters = { ...localFilters }
    delete newFilters[filterKey]
    setLocalFilters(newFilters)
    onFilter(newFilters)
  }

  const clearAllFilters = () => {
    setLocalFilters({})
    onFilter({})
  }

  const activeFilterCount = Object.keys(activeFilters).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {filters.map((filter) => (
            <div key={filter.key} className="min-w-48">
              <Select
                value={localFilters[filter.key] || ''}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All {filter.label}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {/* Sort Options */}
          <div className="min-w-48">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={handleSortOrderToggle}
            className="min-w-20"
          >
            {sortOrder === 'asc' ? '↑' : '↓'} Sort
          </Button>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Active filters:</span>
            {Object.entries(activeFilters).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {filters.find(f => f.key === key)?.label}: {value}
                <button
                  onClick={() => clearFilter(key)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

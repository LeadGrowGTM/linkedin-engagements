import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export interface EngagerFilters {
  industry?: string
  location?: string
  companySize?: string
  headlineKeyword?: string
  parentProfile?: string
}

interface EngagerFiltersProps {
  filters: EngagerFilters
  onFiltersChange: (filters: EngagerFilters) => void
  availableIndustries: string[]
  availableLocations: string[]
  availableProfiles: Array<{ url: string; name: string }>
}

const COMPANY_SIZES = [
  { value: '1-10', label: 'Startup (1-10)' },
  { value: '11-50', label: 'Small (11-50)' },
  { value: '51-200', label: 'Medium (51-200)' },
  { value: '201-500', label: 'Mid-Market (201-500)' },
  { value: '501-1000', label: 'Large (501-1000)' },
  { value: '1001-5000', label: 'Enterprise (1001-5000)' },
  { value: '5001-10000', label: 'Large Enterprise (5001-10000)' },
  { value: '10001+', label: 'Global Enterprise (10001+)' },
]

export default function EngagerFilters({
  filters,
  onFiltersChange,
  availableIndustries,
  availableLocations,
  availableProfiles,
}: EngagerFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<EngagerFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApply = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleReset = () => {
    const emptyFilters: EngagerFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const activeFilterCount = Object.keys(filters).filter(
    key => filters[key as keyof EngagerFilters] !== undefined && filters[key as keyof EngagerFilters] !== ''
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Industry Filter */}
            <div>
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                value={localFilters.industry || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, industry: e.target.value || undefined })
                }
                className="mt-1 flex h-10 w-full rounded-md border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              >
                <option value="">All Industries</option>
                {availableIndustries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <Label htmlFor="location">Location</Label>
              <select
                id="location"
                value={localFilters.location || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, location: e.target.value || undefined })
                }
                className="mt-1 flex h-10 w-full rounded-md border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              >
                <option value="">All Locations</option>
                {availableLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Size Filter */}
            <div>
              <Label htmlFor="companySize">Company Size</Label>
              <select
                id="companySize"
                value={localFilters.companySize || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, companySize: e.target.value || undefined })
                }
                className="mt-1 flex h-10 w-full rounded-md border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              >
                <option value="">All Sizes</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Headline Keyword */}
            <div>
              <Label htmlFor="headlineKeyword">Title/Headline Keyword</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
                <Input
                  id="headlineKeyword"
                  type="text"
                  placeholder="CEO, Founder, Director..."
                  value={localFilters.headlineKeyword || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, headlineKeyword: e.target.value || undefined })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Engaged With (Parent Profile) */}
            <div>
              <Label htmlFor="parentProfile">Engaged With</Label>
              <select
                id="parentProfile"
                value={localFilters.parentProfile || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, parentProfile: e.target.value || undefined })
                }
                className="mt-1 flex h-10 w-full rounded-md border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              >
                <option value="">All Profiles</option>
                {availableProfiles.map((profile) => (
                  <option key={profile.url} value={profile.url}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </div>
        </Card>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.industry && (
            <Badge variant="secondary" className="gap-1">
              Industry: {filters.industry}
              <button
                onClick={() => onFiltersChange({ ...filters, industry: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.location && (
            <Badge variant="secondary" className="gap-1">
              Location: {filters.location}
              <button
                onClick={() => onFiltersChange({ ...filters, location: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.companySize && (
            <Badge variant="secondary" className="gap-1">
              Size: {filters.companySize}
              <button
                onClick={() => onFiltersChange({ ...filters, companySize: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.minScore && (
            <Badge variant="secondary" className="gap-1">
              Score ≥ {filters.minScore}
              <button
                onClick={() => onFiltersChange({ ...filters, minScore: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.maxScore && (
            <Badge variant="secondary" className="gap-1">
              Score ≤ {filters.maxScore}
              <button
                onClick={() => onFiltersChange({ ...filters, maxScore: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.headlineKeyword && (
            <Badge variant="secondary" className="gap-1">
              Keyword: {filters.headlineKeyword}
              <button
                onClick={() => onFiltersChange({ ...filters, headlineKeyword: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}


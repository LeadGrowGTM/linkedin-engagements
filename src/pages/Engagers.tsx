import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, Download, Send, ArrowUpDown, ArrowUp, ArrowDown, Building2, MapPin, TrendingUp, ExternalLink, Search, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import EngagerFilters, { EngagerFilters as FilterType } from '@/components/dashboard/EngagerFilters'
import { useEngagersTracked, TimeRange } from '@/hooks/useDashboard'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import { usePushToClay } from '@/hooks/usePushToClay'
import { useExportCSV } from '@/hooks/useExport'
import { useToast } from '@/components/ui/toast'
import { formatNumber } from '@/lib/utils'

type SortField = 'fullName' | 'connections' | 'followers' | 'companyName' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

export default function Engagers() {
  const [timeRange, setTimeRange] = useState<TimeRange>(30)
  const [filters, setFilters] = useState<FilterType>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: engagers, isLoading } = useEngagersTracked(timeRange)
  const { data: filterOptions } = useFilterOptions()
  const { pushMultipleLeads, isPushing } = usePushToClay()
  const { exportToCSV, isExporting } = useExportCSV()
  const { showToast, showActionToast } = useToast()

  // Filter and sort engagers
  const filteredEngagers = useMemo(() => {
    if (!engagers) return []

    let result = [...engagers]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(e =>
        e.fullName.toLowerCase().includes(query) ||
        e.headline.toLowerCase().includes(query) ||
        e.companyName.toLowerCase().includes(query)
      )
    }

    // Apply filters
    if (filters.industry) {
      result = result.filter(e => e.companyIndustry === filters.industry)
    }
    if (filters.location) {
      result = result.filter(e => e.location === filters.location)
    }
    if (filters.companySize) {
      result = result.filter(e => e.companySize === filters.companySize)
    }
    if (filters.headlineKeyword) {
      const keyword = filters.headlineKeyword.toLowerCase()
      result = result.filter(e => e.headline.toLowerCase().includes(keyword))
    }
    if (filters.parentProfile) {
      result = result.filter(e => e.parentProfile === filters.parentProfile)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'fullName':
          comparison = a.fullName.localeCompare(b.fullName)
          break
        case 'connections':
          comparison = (a.connections || 0) - (b.connections || 0)
          break
        case 'followers':
          comparison = (a.followers || 0) - (b.followers || 0)
          break
        case 'companyName':
          comparison = a.companyName.localeCompare(b.companyName)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [engagers, filters, searchQuery, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEngagers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredEngagers.map(e => e.profileUrl)))
    }
  }

  const toggleSelect = (profileUrl: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(profileUrl)) {
      newSelected.delete(profileUrl)
    } else {
      newSelected.add(profileUrl)
    }
    setSelectedIds(newSelected)
  }

  const handleExport = () => {
    const dataToExport = filteredEngagers.filter(e => selectedIds.has(e.profileUrl))
    if (dataToExport.length === 0) {
      showToast('No engagers selected', 'error')
      return
    }
    exportToCSV(dataToExport.map(e => ({
      name: e.fullName,
      headline: e.headline,
      company: e.companyName,
      industry: e.companyIndustry || '',
      location: e.location || '',
      connections: e.connections || 0,
      followers: e.followers || 0,
      linkedin_url: e.profileUrl,
    })), 'engagers-export')
    showToast(`Exported ${dataToExport.length} engagers to CSV`, 'success')
  }

  const handlePushToClay = async () => {
    const selectedEngagers = filteredEngagers.filter(e => selectedIds.has(e.profileUrl))
    if (selectedEngagers.length === 0) {
      showToast('No engagers selected', 'error')
      return
    }
    // Map to the format expected by usePushToClay
    const leadsData = selectedEngagers.map(e => ({
      profile_url: e.profileUrl,
      full_name: e.fullName,
      first_name: e.firstName,
      last_name: e.lastName,
      headline: e.headline,
      about: e.about,
      company_name: e.companyName,
      company_linkedin_url: e.companyLinkedinUrl,
      company_website: e.companyWebsite,
      company_industry: e.companyIndustry,
      company_size: e.companySize,
      location: e.location,
      connections: e.connections,
      followers: e.followers,
      skills: e.skills,
      experiences: e.experiences,
      educations: e.educations,
    }))

    const doPush = async () => {
      const result = await pushMultipleLeads(leadsData)

      // Check if proxy URL is missing - direct to Settings
      if (!result.success && result.message.includes('No Clay Proxy URL')) {
        showToast('Set up Clay Proxy URL in Settings first', 'error')
        return
      }

      // Check if only webhook URL is missing - show quick input toast
      if (!result.success && result.message.includes('No Clay Webhook URL')) {
        showActionToast('Enter your Clay Webhook URL', 'clay-webhook', doPush)
        return
      }

      showToast(result.message, result.success ? 'success' : 'error')
      if (result.success) {
        setSelectedIds(new Set())
      }
    }

    await doPush()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
            Engagers
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Browse and manage all people who engaged with your monitored profiles
          </p>
        </div>
        <div className="flex gap-2">
          {timeRanges.map(({ value, label }) => (
            <Button
              key={value}
              variant={timeRange === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Total Engagers
                </p>
                <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                  {formatNumber(engagers?.length || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Filtered Results
                </p>
                <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                  {formatNumber(filteredEngagers.length)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Selected
                </p>
                <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                  {formatNumber(selectedIds.size)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
            <Input
              type="text"
              placeholder="Search by name, headline, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex-1">
            <EngagerFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableIndustries={filterOptions?.industries || []}
              availableLocations={filterOptions?.locations || []}
              availableProfiles={filterOptions?.profiles || []}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-950/50 rounded-lg border border-primary-200 dark:border-primary-800">
            <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={handlePushToClay}
                disabled={isPushing}
                className="gap-2"
              >
                <Send className={`h-4 w-4 ${isPushing ? 'animate-pulse' : ''}`} />
                {isPushing ? 'Pushing...' : 'Push to Clay'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Engagers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Engagers List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-navy-100 dark:bg-navy-800 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredEngagers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-navy-400 dark:text-navy-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-navy-900 dark:text-navy-50">
                No engagers found
              </h3>
              <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
                Try adjusting your filters or time range
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedIds.size === filteredEngagers.length && filteredEngagers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('fullName')}
                        className="flex items-center font-medium hover:text-primary"
                      >
                        Name
                        <SortIcon field="fullName" />
                      </button>
                    </TableHead>
                    <TableHead>Headline</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('companyName')}
                        className="flex items-center font-medium hover:text-primary"
                      >
                        Company
                        <SortIcon field="companyName" />
                      </button>
                    </TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('connections')}
                        className="flex items-center font-medium hover:text-primary"
                      >
                        Connections
                        <SortIcon field="connections" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('followers')}
                        className="flex items-center font-medium hover:text-primary"
                      >
                        Followers
                        <SortIcon field="followers" />
                      </button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEngagers.map((engager) => (
                    <TableRow key={engager.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(engager.profileUrl)}
                          onCheckedChange={() => toggleSelect(engager.profileUrl)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {engager.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <Link
                              to={`/engagers/${encodeURIComponent(engager.profileUrl)}`}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {engager.fullName}
                            </Link>
                            {engager.engagementCount > 1 && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {engager.engagementCount}x
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                          {engager.headline}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {engager.companyName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {engager.companyIndustry && (
                          <Badge variant="outline" className="text-xs">
                            {engager.companyIndustry}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {engager.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{engager.location}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {engager.connections ? formatNumber(engager.connections) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {engager.followers ? formatNumber(engager.followers) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={engager.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          LinkedIn
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

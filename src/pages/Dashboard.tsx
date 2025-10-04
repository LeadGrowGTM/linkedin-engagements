import { useState, useMemo } from 'react'
import { Users, FileText, UserPlus, TrendingUp } from 'lucide-react'
import MetricsCard from '@/components/dashboard/MetricsCard'
import EngagersTable from '@/components/dashboard/LeadsTable'
import EngagerFilters, { type EngagerFilters as EngagerFiltersType } from '@/components/dashboard/EngagerFilters'
import { useDashboardMetrics, useEngagersTracked, TimeRange } from '@/hooks/useDashboard'
import { useRealtimeAll } from '@/hooks/useRealtime'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import { Button } from '@/components/ui/button'

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>(7)
  const [filters, setFilters] = useState<EngagerFiltersType>({})
  
  // Enable realtime subscriptions
  useRealtimeAll()
  
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(timeRange)
  const { data: allEngagers, isLoading: engagersLoading } = useEngagersTracked(timeRange)
  const { data: filterOptions } = useFilterOptions()

  // Apply filters client-side
  const filteredEngagers = useMemo(() => {
    if (!allEngagers) return []
    
    return allEngagers.filter(engager => {
      // Industry filter
      if (filters.industry && engager.companyIndustry !== filters.industry) {
        return false
      }
      
      // Location filter
      if (filters.location && engager.location !== filters.location) {
        return false
      }
      
      // Company size filter
      if (filters.companySize && engager.companySize !== filters.companySize) {
        return false
      }
      
      // Min score filter
      if (filters.minScore && engager.leadScore < filters.minScore) {
        return false
      }
      
      // Max score filter
      if (filters.maxScore && engager.leadScore > filters.maxScore) {
        return false
      }
      
      // Headline keyword filter
      if (filters.headlineKeyword) {
        const keyword = filters.headlineKeyword.toLowerCase()
        const headline = engager.headline.toLowerCase()
        if (!headline.includes(keyword)) {
          return false
        }
      }
      
      // Parent profile filter
      if (filters.parentProfile && engager.parentProfile !== filters.parentProfile) {
        return false
      }
      
      return true
    })
  }, [allEngagers, filters])

  return (
    <div className="space-y-8">
      {/* Header with time range filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Overview of your LinkedIn engagement monitoring
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

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Profiles Monitored"
          value={metrics?.activeProfiles || 0}
          icon={Users}
          format="number"
          isLoading={metricsLoading}
        />
        <MetricsCard
          title="Total Posts"
          value={metrics?.totalPosts || 0}
          icon={FileText}
          format="number"
          isLoading={metricsLoading}
        />
        <MetricsCard
          title="Unique Engagers"
          value={metrics?.uniqueEngagers || 0}
          icon={UserPlus}
          format="number"
          isLoading={metricsLoading}
        />
        <MetricsCard
          title="Avg Engagement Rate"
          value={metrics?.engagementRate || 0}
          icon={TrendingUp}
          format="percentage"
          isLoading={metricsLoading}
        />
      </div>

      {/* Engagers Tracked Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-50">
              Engagers Tracked
            </h2>
            <p className="text-sm text-navy-500 dark:text-navy-400">
              {filteredEngagers.length} of {allEngagers?.length || 0} engagers from the last {timeRange} days
            </p>
          </div>
        </div>
        
        <EngagerFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableIndustries={filterOptions?.industries || []}
          availableLocations={filterOptions?.locations || []}
          availableProfiles={filterOptions?.profiles || []}
        />
        
        <EngagersTable engagers={filteredEngagers} isLoading={engagersLoading} />
      </div>
    </div>
  )
}


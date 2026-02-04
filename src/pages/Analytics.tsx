import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  useIndustryDistribution,
  useCompanySizeDistribution,
  useLocationDistribution,
  useSkillsDistribution,
  useEngagementTrends,
  useEngagementPatterns,
} from '@/hooks/useAnalytics'
import { TimeRange } from '@/hooks/useDashboard'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Building2, MapPin, Award, Activity } from 'lucide-react'

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6']

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>(30)

  const { data: industryData, isLoading: industryLoading } = useIndustryDistribution(timeRange)
  const { data: companySizeData, isLoading: sizeLoading } = useCompanySizeDistribution(timeRange)
  const { data: locationData, isLoading: locationLoading } = useLocationDistribution(timeRange)
  const { data: skillsData, isLoading: skillsLoading } = useSkillsDistribution(timeRange)
  const { data: trendsData, isLoading: trendsLoading } = useEngagementTrends(timeRange)
  const { data: patternsData, isLoading: patternsLoading } = useEngagementPatterns()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Deep insights into your engagement data
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

      {/* Engagement Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Engagement Trends
          </CardTitle>
          <CardDescription>
            Daily engagement over the last {timeRange} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-navy-500">Loading...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  name="Engagers"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Industry and Company Size */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Industry Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Industry Distribution
            </CardTitle>
            <CardDescription>
              Top industries engaging with your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {industryLoading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-navy-500">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={industryData?.slice(0, 8) || []}
                    dataKey="count"
                    nameKey="industry"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                >
                  {(industryData?.slice(0, 8) || []).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Company Size Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Size Distribution
            </CardTitle>
            <CardDescription>
              Engagement by company size
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sizeLoading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-navy-500">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companySizeData || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="size" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geographic Distribution
          </CardTitle>
          <CardDescription>
            Top 10 locations of engagers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locationLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-navy-500">Loading...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Skills
          </CardTitle>
          <CardDescription>
            Most common skills among engagers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skillsLoading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-navy-500">Loading...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(skillsData || []).slice(0, 20).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-800"
                >
                  <span className="text-sm font-medium text-navy-900 dark:text-navy-50 truncate">
                    {item.skill}
                  </span>
                  <span className="ml-2 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Patterns Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Engagement Patterns
          </CardTitle>
          <CardDescription>
            Day of week and time of day engagement analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patternsLoading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-navy-500">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <p className="text-sm text-navy-500 dark:text-navy-400 mb-4">
                Coming soon: Interactive heatmap showing engagement by day and hour
              </p>
              <div className="min-w-[800px] text-xs">
                {Object.entries(patternsData || {}).map(([day, hours]) => {
                  const total = Object.values(hours as { [key: string]: number }).reduce((a, b) => a + b, 0)
                  return (
                    <div key={day} className="flex items-center gap-2 py-2 border-b border-navy-200 dark:border-navy-800">
                      <div className="w-24 font-medium text-navy-900 dark:text-navy-50">{day}</div>
                      <div className="flex-1 flex gap-1">
                        {Array.from({ length: 24 }).map((_, hour) => {
                          const count = (hours as any)[hour] || 0
                          const intensity = total > 0 ? (count / total) * 100 : 0
                          return (
                            <div
                              key={hour}
                              className="h-8 flex-1 rounded"
                              style={{
                                backgroundColor: `rgba(14, 165, 233, ${intensity / 100})`,
                                border: '1px solid rgba(14, 165, 233, 0.2)'
                              }}
                              title={`${hour}:00 - ${count} engagements`}
                            />
                          )
                        })}
                      </div>
                      <div className="w-12 text-right text-navy-500 dark:text-navy-400">{total}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

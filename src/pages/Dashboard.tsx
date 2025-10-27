import { useState } from 'react'
import { Users, FileText, TrendingUp, ExternalLink, BarChart3, CheckCircle, Clock, AlertCircle, RefreshCw, Building2, Award } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardMetrics, TimeRange } from '@/hooks/useDashboard'
import { useRealtimeAll } from '@/hooks/useRealtime'
import { useProfileStats } from '@/hooks/useProfiles'
import { useAllPosts } from '@/hooks/usePosts'
import {
  useIndustryDistribution,
  useCompanySizeDistribution,
  useSkillsDistribution,
  useEngagementTrends,
} from '@/hooks/useAnalytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parseLinkedInUsername, formatNumber } from '@/lib/utils'
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>(7)
  const navigate = useNavigate()
  
  // Enable realtime subscriptions
  useRealtimeAll()
  
  const { data: metrics } = useDashboardMetrics(timeRange)
  const { data: profiles, isLoading: profilesLoading } = useProfileStats()
  const { data: posts, isLoading: postsLoading } = useAllPosts()

  // Analytics data
  const { data: industryData, isLoading: industryLoading } = useIndustryDistribution(timeRange)
  const { data: companySizeData, isLoading: sizeLoading } = useCompanySizeDistribution(timeRange)
  const { data: skillsData, isLoading: skillsLoading } = useSkillsDistribution(timeRange)
  const { data: trendsData, isLoading: trendsLoading } = useEngagementTrends(timeRange)

  // Calculate sync statistics
  const syncStats = {
    total: posts?.length || 0,
    completed: posts?.filter(p => p.status?.toUpperCase() === 'COMPLETED' || p.status?.toUpperCase() === 'PROCESSED - 1').length || 0,
    processing: posts?.filter(p => p.status?.toUpperCase() === 'PROCESSING').length || 0,
    pending: posts?.filter(p => p.status?.toUpperCase() === 'PENDING').length || 0,
  }
  const syncPercentage = syncStats.total > 0 ? Math.round((syncStats.completed / syncStats.total) * 100) : 0

  return (
    <div className="flex gap-6 h-screen">
      {/* Main Content */}
      <div className="flex-1 space-y-8 overflow-y-auto scrollbar-hide">
      {/* Header with time range filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
              Dashboard & Analytics
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
              Overview and insights into your LinkedIn engagement monitoring
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

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Sync Status</CardTitle>
              <CardDescription>
                Confirm the system is getting the data we expect
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/posts')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              View All Posts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="h-32 bg-navy-100 dark:bg-navy-800 rounded-lg animate-pulse" />
          ) : (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
                    Engagement Data Synced
                  </span>
                  <span className="text-sm font-semibold text-navy-900 dark:text-navy-50">
                    {syncPercentage}%
                  </span>
                </div>
                <div className="h-2 bg-navy-200 dark:bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                    style={{ width: `${syncPercentage}%` }}
                  />
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800">
                  <div className="flex items-center gap-2 text-navy-500 dark:text-navy-400 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-medium">Total Posts</span>
                  </div>
                  <p className="text-2xl font-bold text-navy-900 dark:text-navy-50">
                    {formatNumber(syncStats.total)}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {formatNumber(syncStats.completed)}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Processing</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {formatNumber(syncStats.processing)}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {formatNumber(syncStats.pending)}
                  </p>
                </div>
              </div>

              {/* Sync Info */}
              <div className="flex items-center gap-2 text-sm text-navy-600 dark:text-navy-400 pt-2 border-t border-navy-200 dark:border-navy-800">
                <RefreshCw className="h-4 w-4" />
                <span>
                  System is actively monitoring {metrics?.activeProfiles || 0} profiles and has synced {syncStats.completed} of {syncStats.total} posts
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

        {/* Charts Row - Engagement Trends, Industry, Company Size */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Engagement Trends */}
          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4" />
                Engagement Trends
              </CardTitle>
              <CardDescription className="text-sm">
                Daily engagement over the last {timeRange} days
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {trendsLoading ? (
                <div className="h-56 flex items-center justify-center">
                  <p className="text-navy-500 text-sm">Loading...</p>
                </div>
              ) : (
                <ChartContainer className="h-56" config={{
                  count: {
                    label: "Engagers",
                    color: "hsl(var(--chart-1))",
                  }
                }}>
                  <LineChart data={trendsData || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      axisLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'hsl(var(--card-foreground))',
                        boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Industry Distribution */}
          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4" />
                Industry Distribution
              </CardTitle>
              <CardDescription className="text-sm">
                Top industries engaging with your content
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {industryLoading ? (
                <div className="h-56 flex items-center justify-center">
                  <p className="text-navy-500 text-sm">Loading...</p>
                </div>
              ) : (
                <ChartContainer 
                  className="[&_.recharts-pie-label-text]:fill-foreground h-56" 
                  config={{
                    count: {
                      label: "Count",
                      color: "hsl(var(--chart-1))",
                    }
                  }}
                >
                  <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'hsl(var(--card-foreground))',
                        boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)'
                      }}
                    />
                    <Pie
                      data={industryData?.slice(0, 6).map((item, index) => ({
                        ...item,
                        fill: `hsl(var(--chart-${(index % 5) + 1}))`
                      })) || []}
                      dataKey="count"
                      nameKey="industry"
                      label={({ industry }) => industry}
                      labelLine={true}
                      fontSize={11}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Company Size Distribution */}
          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4" />
                Company Size Distribution
              </CardTitle>
              <CardDescription className="text-sm">
                Engagement by company size
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {sizeLoading ? (
                <div className="h-56 flex items-center justify-center">
                  <p className="text-navy-500 text-sm">Loading...</p>
                </div>
              ) : (
                <ChartContainer className="h-56" config={{
                  count: {
                    label: "Count",
                    color: "hsl(var(--chart-1))",
                  }
                }}>
                  <BarChart data={companySizeData || []} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="size"
                      type="category"
                      width={80}
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'hsl(var(--card-foreground))',
                        boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)'
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--chart-1))"
                      radius={[0, 2, 2, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Skills */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-4 w-4" />
              Top Skills
            </CardTitle>
            <CardDescription className="text-sm">
              Most common skills among engagers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {skillsLoading ? (
              <div className="h-56 flex items-center justify-center">
                <p className="text-navy-500 text-sm">Loading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(skillsData || []).slice(0, 8).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border/50"
                  >
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.skill}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground bg-background px-2 py-1 rounded">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar - Monitored Profiles */}
      <div className="w-80 flex-shrink-0 h-screen">
        <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Monitored Profiles</CardTitle>
          <CardDescription>
              Quick access to your profiles
          </CardDescription>
        </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
          {profilesLoading ? (
              <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-navy-100 dark:bg-navy-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : profiles && profiles.length > 0 ? (
              <div className="space-y-3">
              {profiles.map((profile) => {
                const username = parseLinkedInUsername(profile.profile_url)
                
                return (
                  <div
                    key={profile.id}
                      className="p-3 rounded-lg border border-navy-200 dark:border-navy-800 hover:bg-navy-50 dark:hover:bg-navy-900 transition-colors"
                  >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white">
                          {username.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-navy-900 dark:text-navy-50 truncate">
                            {username}
                          </h4>
                          {profile.is_enabled ? (
                            <Badge variant="success" className="text-xs mt-1">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs mt-1">Inactive</Badge>
                          )}
                        </div>
                        </div>
                        
                      <div className="text-xs text-navy-500 dark:text-navy-400 space-y-1 mb-2">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                            {formatNumber(profile.postCount)} posts
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                            {formatNumber(profile.engagerCount)} engagers
                      </div>
                    </div>
                    
                      <div className="flex gap-2 pt-2 border-t border-navy-200 dark:border-navy-800">
                      <Button
                          variant="ghost"
                        size="sm"
                        onClick={() => window.open(profile.profile_url, '_blank')}
                          className="flex-1 h-7 text-xs"
                      >
                          <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const encodedUrl = encodeURIComponent(profile.profile_url)
                          navigate(`/profiles/${encodedUrl}/posts`)
                        }}
                          className="flex-1 h-7 text-xs gap-1"
                      >
                          <BarChart3 className="h-3 w-3" />
                          Stats
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
              <div className="text-center py-8">
                <p className="text-xs text-navy-500 dark:text-navy-400 mb-2">
                  No profiles yet
              </p>
              <Button
                  variant="outline"
                size="sm"
                onClick={() => navigate('/profiles')}
                  className="w-full text-xs"
              >
                  Add Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}


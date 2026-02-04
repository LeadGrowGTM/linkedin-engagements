import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, TrendingUp, Building2, Award, Briefcase, FileText, ArrowRight, BarChart3 } from 'lucide-react'
import { useDashboardMetrics, TimeRange } from '@/hooks/useDashboard'
import { useRealtimeAll } from '@/hooks/useRealtime'
import {
  useIndustryDistribution,
  useCompanySizeDistribution,
  useSkillsDistribution,
  useEngagementTrends,
  useTopTitles,
} from '@/hooks/useAnalytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
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

  // Enable realtime subscriptions
  useRealtimeAll()

  const { data: metrics } = useDashboardMetrics(timeRange)

  // Analytics data
  const { data: industryData, isLoading: industryLoading } = useIndustryDistribution(timeRange)
  const { data: companySizeData, isLoading: sizeLoading } = useCompanySizeDistribution(timeRange)
  const { data: skillsData, isLoading: skillsLoading } = useSkillsDistribution(timeRange)
  const { data: trendsData, isLoading: trendsLoading } = useEngagementTrends(timeRange)
  const { data: titlesData, isLoading: titlesLoading } = useTopTitles(timeRange)

  return (
    <div className="space-y-8">
      {/* Header with time range filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
            Dashboard
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Active Profiles
                </p>
                <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                  {formatNumber(metrics?.activeProfiles || 0)}
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
                  Posts Tracked
                </p>
                <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                  {formatNumber(metrics?.totalPosts || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Unique Engagers
                </p>
                <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                  {formatNumber(metrics?.uniqueEngagers || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Avg Engagement
                </p>
                <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                  {(metrics?.engagementRate || 0).toFixed(1)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/engagers" className="block">
          <Card className="hover:border-primary-500 dark:hover:border-primary-600 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-navy-900 dark:text-navy-50">View All Engagers</p>
                  <p className="text-sm text-navy-500 dark:text-navy-400">Browse and filter leads</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-navy-400" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/analytics" className="block">
          <Card className="hover:border-primary-500 dark:hover:border-primary-600 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-navy-900 dark:text-navy-50">Deep Analytics</p>
                  <p className="text-sm text-navy-500 dark:text-navy-400">Charts and heatmaps</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-navy-400" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/posts" className="block">
          <Card className="hover:border-primary-500 dark:hover:border-primary-600 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-navy-900 dark:text-navy-50">Post Sync Status</p>
                  <p className="text-sm text-navy-500 dark:text-navy-400">Monitor data pipeline</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-navy-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

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

      {/* Top Skills & Top Titles Row */}
      <div className="grid gap-4 lg:grid-cols-2">
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

        {/* Top Titles */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-4 w-4" />
              Top Titles
            </CardTitle>
            <CardDescription className="text-sm">
              Most common job titles among engagers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {titlesLoading ? (
              <div className="h-56 flex items-center justify-center">
                <p className="text-navy-500 text-sm">Loading...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(titlesData || []).slice(0, 8).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border/50"
                  >
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.title}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground bg-background px-2 py-1 rounded">
                      {item.count}
                    </span>
                  </div>
                ))}
                {(!titlesData || titlesData.length === 0) && (
                  <div className="h-56 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-navy-500 text-sm mb-2">No engagement data found</p>
                      <p className="text-navy-400 text-xs">Top Titles will appear once profiles are enriched and engagement data is available.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Users, FileText, UserPlus, TrendingUp, ExternalLink, BarChart3, Calendar, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MetricsCard from '@/components/dashboard/MetricsCard'
import { useDashboardMetrics, TimeRange } from '@/hooks/useDashboard'
import { useRealtimeAll } from '@/hooks/useRealtime'
import { useProfileStats } from '@/hooks/useProfiles'
import { useAllPosts } from '@/hooks/usePosts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parseLinkedInUsername, formatDate, formatNumber } from '@/lib/utils'

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
  
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(timeRange)
  const { data: profiles, isLoading: profilesLoading } = useProfileStats()
  const { data: posts, isLoading: postsLoading } = useAllPosts()

  // Calculate sync statistics
  const syncStats = {
    total: posts?.length || 0,
    completed: posts?.filter(p => p.status?.toUpperCase() === 'COMPLETED' || p.status?.toUpperCase() === 'PROCESSED - 1').length || 0,
    processing: posts?.filter(p => p.status?.toUpperCase() === 'PROCESSING').length || 0,
    pending: posts?.filter(p => p.status?.toUpperCase() === 'PENDING').length || 0,
  }
  const syncPercentage = syncStats.total > 0 ? Math.round((syncStats.completed / syncStats.total) * 100) : 0

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

      {/* Monitored Profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Monitored Profiles</CardTitle>
          <CardDescription>
            Quick access to post performance analytics for each profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profilesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-navy-100 dark:bg-navy-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div className="space-y-4">
              {profiles.map((profile) => {
                const username = parseLinkedInUsername(profile.profile_url)
                
                return (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-navy-200 dark:border-navy-800 hover:bg-navy-50 dark:hover:bg-navy-900 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0">
                        <span className="text-white font-semibold text-lg">
                          {username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-navy-900 dark:text-navy-50">
                            {username}
                          </h3>
                          {profile.is_enabled ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        
                        <div className="mt-1 flex items-center gap-4 text-sm text-navy-500 dark:text-navy-400">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {formatNumber(profile.postCount)} posts
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {formatNumber(profile.engagerCount)} engagers
                          </span>
                          {profile.created_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Added {formatDate(profile.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(profile.profile_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          const encodedUrl = encodeURIComponent(profile.profile_url)
                          navigate(`/profiles/${encodedUrl}/posts`)
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-navy-500 dark:text-navy-400">
                No profiles being monitored yet.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/profiles')}
                className="mt-4"
              >
                Add Your First Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


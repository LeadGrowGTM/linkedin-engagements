import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, TrendingUp, Users, Target, Calendar, FileText, MapPin, Building2, Flame, Snowflake, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePostPerformance } from '@/hooks/usePostPerformance'
import { parseLinkedInUsername, formatDate, formatNumber } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

export default function PostPerformance() {
  const { profileUrl } = useParams<{ profileUrl: string }>()
  const decodedUrl = profileUrl ? decodeURIComponent(profileUrl) : ''
  const navigate = useNavigate()
  
  const { data, isLoading } = usePostPerformance(decodedUrl)
  const username = parseLinkedInUsername(decodedUrl)

  const COLORS = {
    hot: '#ef4444',
    warm: '#f59e0b',
    cold: '#3b82f6',
  }

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/profiles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profiles
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-navy-500">Loading post performance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/profiles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profiles
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
              Post Performance
            </h1>
            <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
              Analyzing posts from {username}
            </p>
          </div>
        </div>
        <a
          href={decodedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          View Profile
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy-900 dark:text-navy-50">
              {formatNumber(data?.totalPosts || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Total Engagers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy-900 dark:text-navy-50">
              {formatNumber(data?.totalEngagers || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              Avg Engagers/Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy-900 dark:text-navy-50">
              {data?.totalPosts && data.totalPosts > 0
                ? formatNumber(Math.round(data.totalEngagers / data.totalPosts))
                : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5" />
              Avg Lead Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy-900 dark:text-navy-50">
              {data?.avgLeadScore || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Quality Distribution</CardTitle>
            <CardDescription>Breakdown of engagers by lead score</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.leadQuality && (data.leadQuality.hot + data.leadQuality.warm + data.leadQuality.cold) > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Hot Leads', value: data.leadQuality.hot, color: COLORS.hot },
                      { name: 'Warm Leads', value: data.leadQuality.warm, color: COLORS.warm },
                      { name: 'Cold Leads', value: data.leadQuality.cold, color: COLORS.cold },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[data.leadQuality.hot, data.leadQuality.warm, data.leadQuality.cold].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-navy-500 py-12">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Industries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Industries</CardTitle>
            <CardDescription>Engager distribution by industry</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.industryBreakdown && data.industryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.industryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-navy-200 dark:stroke-navy-800" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    className="text-xs fill-navy-600 dark:fill-navy-400"
                  />
                  <YAxis className="fill-navy-600 dark:fill-navy-400" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-navy-500 py-12">No industry data available</p>
            )}
          </CardContent>
        </Card>

        {/* Company Size Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Company Size Distribution</CardTitle>
            <CardDescription>Engagers by company size</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.companySizeBreakdown && data.companySizeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.companySizeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-navy-200 dark:stroke-navy-800" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    className="text-xs fill-navy-600 dark:fill-navy-400"
                  />
                  <YAxis className="fill-navy-600 dark:fill-navy-400" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-navy-500 py-12">No company size data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Geographic distribution of engagers</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.locationBreakdown && data.locationBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.locationBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-navy-200 dark:stroke-navy-800" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    className="text-xs fill-navy-600 dark:fill-navy-400"
                  />
                  <YAxis className="fill-navy-600 dark:fill-navy-400" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-navy-500 py-12">No location data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Timeline */}
      {data?.engagementTimeline && data.engagementTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Engagement Timeline</CardTitle>
            <CardDescription>Daily engagement activity (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.engagementTimeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-navy-200 dark:stroke-navy-800" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-navy-600 dark:fill-navy-400"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis className="fill-navy-600 dark:fill-navy-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Engagers */}
      {data?.topEngagers && data.topEngagers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Engagers by Lead Score</CardTitle>
            <CardDescription>Your highest-value engagers for this profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topEngagers.map((engager) => (
                <div
                  key={engager.profile_url}
                  className="flex items-center justify-between p-4 rounded-lg border border-navy-200 dark:border-navy-800 hover:bg-navy-50 dark:hover:bg-navy-900 transition-colors cursor-pointer"
                  onClick={() => {
                    const encodedUrl = encodeURIComponent(engager.profile_url)
                    navigate(`/engager/${encodedUrl}`)
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {engager.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-navy-900 dark:text-navy-50 truncate">
                          {engager.full_name || 'Unknown'}
                        </p>
                        <Badge 
                          variant={
                            engager.leadCategory === 'Hot' ? 'destructive' :
                            engager.leadCategory === 'Warm' ? 'default' : 'secondary'
                          }
                        >
                          {engager.leadCategory === 'Hot' && <Flame className="h-3 w-3 mr-1" />}
                          {engager.leadCategory === 'Warm' && <Star className="h-3 w-3 mr-1" />}
                          {engager.leadCategory === 'Cold' && <Snowflake className="h-3 w-3 mr-1" />}
                          {engager.leadCategory}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-navy-500 dark:text-navy-400">
                        {engager.headline && (
                          <span className="truncate">{engager.headline}</span>
                        )}
                        {engager.company_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {engager.company_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right shrink-0">
                    <p className="text-2xl font-bold text-navy-900 dark:text-navy-50">
                      {engager.leadScore}
                    </p>
                    <p className="text-xs text-navy-500 dark:text-navy-400">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
          <CardDescription>
            {data?.posts.length || 0} posts sorted by most recent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.posts && data.posts.length > 0 ? (
            <div className="space-y-4">
              {data.posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-navy-200 dark:border-navy-800 hover:bg-navy-50 dark:hover:bg-navy-900 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        <ExternalLink className="h-4 w-4 inline mr-1" />
                        View Post on LinkedIn
                      </a>
                      <Badge
                        variant={post.status === 'COMPLETED' ? 'success' : 'secondary'}
                      >
                        {post.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-navy-500 dark:text-navy-400">
                      {post.posted_at_timestamp && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Posted: {formatDate(post.posted_at_timestamp)}
                        </div>
                      )}
                      {post.created_at && (
                        <div className="flex items-center gap-1 text-xs">
                          Tracked: {formatDate(post.created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-navy-500 dark:text-navy-400">
                No posts found for this profile yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

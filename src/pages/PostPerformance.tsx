import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, TrendingUp, Users, Calendar, FileText, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePostPerformance, useUpdatePostStatus } from '@/hooks/usePostPerformance'
import { parseLinkedInUsername, formatDate, formatNumber, cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PostPerformance() {
  const { profileUrl } = useParams<{ profileUrl: string }>()
  const decodedUrl = profileUrl ? decodeURIComponent(profileUrl) : ''
  const navigate = useNavigate()
  
  const { data, isLoading } = usePostPerformance(decodedUrl)
  const updatePostStatus = useUpdatePostStatus()
  const username = parseLinkedInUsername(decodedUrl)

  const handleScrapeAgain = async (postId: number) => {
    try {
      await updatePostStatus.mutateAsync({ postId, status: 'PENDING' })
    } catch (error) {
      console.error('Error updating post status:', error)
    }
  }

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
              {username}
            </h1>
            <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
              Post Performance Analytics
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
      <div className="grid gap-6 md:grid-cols-3">
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-engagers">All Engagers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Analytics Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Industries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Industries</CardTitle>
            <CardDescription>Engager distribution by industry</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.industryBreakdown && data.industryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
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
              <ResponsiveContainer width="100%" height={200}>
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
              <ResponsiveContainer width="100%" height={200}>
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
            <div className="space-y-3">
              {data.posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-navy-200 dark:border-navy-800 hover:bg-navy-50 dark:hover:bg-navy-900 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <Badge
                        variant={post.status === 'COMPLETED' ? 'success' : post.status === 'PENDING' ? 'warning' : 'secondary'}
                      >
                        {post.status}
                      </Badge>
                    </div>
                    {post.post_text && (
                      <p className="text-sm text-navy-900 dark:text-navy-50 mb-2 line-clamp-2">
                        {post.post_text}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-navy-500 dark:text-navy-400">
                      {post.posted_at_timestamp && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Posted: {formatDate(post.posted_at_timestamp)}
                        </span>
                      )}
                      {post.created_at && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          Tracked: {formatDate(post.created_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(post.post_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Post
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleScrapeAgain(post.id)}
                      disabled={updatePostStatus.isPending}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", updatePostStatus.isPending && "animate-spin")} />
                      Scrape Again
                    </Button>
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
        </TabsContent>

        {/* All Engagers Tab */}
        <TabsContent value="all-engagers">
          <Card>
            <CardHeader>
              <CardTitle>All Engagers</CardTitle>
              <CardDescription>
                Complete list of all engagers for this profile ({data?.totalEngagers || 0} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.allEngagers && data.allEngagers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-navy-200 dark:border-navy-800">
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                          Headline
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                          Company
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                          Location
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                          Connections
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-200 dark:divide-navy-800">
                      {data.allEngagers.map((engager) => {
                        return (
                          <tr
                            key={engager.profile_url}
                            className="transition-colors hover:bg-navy-50 dark:hover:bg-navy-900 cursor-pointer"
                            onClick={() => {
                              const encodedUrl = encodeURIComponent(engager.profile_url)
                              navigate(`/engager/${encodedUrl}`)
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                                  <span className="text-white font-semibold">
                                    {engager.full_name?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-navy-900 dark:text-navy-50">
                                    {engager.full_name || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-navy-900 dark:text-navy-50 max-w-xs truncate">
                                {engager.headline || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-navy-900 dark:text-navy-50">
                                {engager.company_name || 'N/A'}
                              </div>
                              {engager.company_industry && (
                                <div className="text-xs text-navy-500 dark:text-navy-400">
                                  {engager.company_industry}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-navy-900 dark:text-navy-50">
                                {engager.location || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-navy-900 dark:text-navy-50">
                                {engager.connections ? formatNumber(engager.connections) : 'N/A'}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-navy-500 dark:text-navy-400">
                    No engagers found for this profile yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

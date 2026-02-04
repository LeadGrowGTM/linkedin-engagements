import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, TrendingUp, Users, Calendar, FileText, RefreshCw, CheckCircle, Clock, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePostPerformance, useUpdatePostStatus } from '@/hooks/usePostPerformance'
import type { Database } from '@/types/database'

type EnrichedProfile = Database['linkedin']['Tables']['enriched_profiles']['Row']
import { useTriggerScrapeEngagers } from '@/hooks/useTriggerScrape'
import { parseLinkedInUsername, formatDate, formatNumber, cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PostPerformance() {
  const { profileUrl } = useParams<{ profileUrl: string }>()
  const decodedUrl = profileUrl ? decodeURIComponent(profileUrl) : ''
  const navigate = useNavigate()
  
  const { data, isLoading } = usePostPerformance(decodedUrl)
  const updatePostStatus = useUpdatePostStatus()
  const { trigger: triggerEngagers, isTriggering, result: engagerResult, clearResult } = useTriggerScrapeEngagers()
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set())
  const username = parseLinkedInUsername(decodedUrl)

  const togglePostExpanded = (postId: number) => {
    setExpandedPosts(prev => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  useEffect(() => {
    if (engagerResult) {
      const timer = setTimeout(clearResult, 4000)
      return () => clearTimeout(timer)
    }
  }, [engagerResult, clearResult])

  const getStatusBadge = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" />Completed</Badge>
      case 'PROCESSED - 1':
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" />Processed - 1 time</Badge>
      case 'PROCESSING':
        return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" />Processing</Badge>
      case 'PENDING':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>
    }
  }

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
              {data.posts.map((post) => {
                const isExpanded = expandedPosts.has(post.id)
                const postEngagers: EnrichedProfile[] = post.engagers || []
                return (
                  <div
                    key={post.id}
                    className="rounded-lg border border-navy-200 dark:border-navy-800 transition-colors"
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-navy-50 dark:hover:bg-navy-900">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          {getStatusBadge(post.status)}
                          {postEngagers.length > 0 && (
                            <button
                              onClick={() => togglePostExpanded(post.id)}
                              className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              <Users className="h-3.5 w-3.5" />
                              {postEngagers.length} engager{postEngagers.length !== 1 ? 's' : ''}
                            </button>
                          )}
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

                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {engagerResult && (
                          <span className={`text-xs ${engagerResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {engagerResult.message}
                          </span>
                        )}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={triggerEngagers}
                          disabled={isTriggering}
                          className="gap-1"
                        >
                          <Zap className={`h-4 w-4 ${isTriggering ? 'animate-pulse' : ''}`} />
                          {isTriggering ? 'Triggering...' : 'Scrape Engagers'}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && postEngagers.length > 0 && (
                      <div className="border-t border-navy-200 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-900/50">
                        <div className="px-4 py-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[220px]">Name</TableHead>
                                <TableHead className="min-w-[180px]">Headline</TableHead>
                                <TableHead className="w-[160px]">Company</TableHead>
                                <TableHead className="w-[140px]">Location</TableHead>
                                <TableHead className="w-[100px] text-right">Connections</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {postEngagers.map((engager) => (
                                <TableRow
                                  key={engager.profile_url}
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => navigate(`/engagers/${encodeURIComponent(engager.profile_url)}`)}
                                >
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                                        <span className="text-white font-semibold text-xs">
                                          {engager.full_name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                      </div>
                                      <span className="font-medium text-sm text-foreground truncate">
                                        {engager.full_name || 'Unknown'}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground truncate block">
                                      {engager.headline || 'N/A'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-foreground">
                                      {engager.company_name || 'N/A'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                      {engager.location || 'N/A'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-sm font-medium text-foreground">
                                      {engager.connections ? formatNumber(engager.connections) : 'N/A'}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[280px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Headline</TableHead>
                        <TableHead className="w-[200px]">Company</TableHead>
                        <TableHead className="w-[180px]">Location</TableHead>
                        <TableHead className="w-[120px] text-right">Connections</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.allEngagers.map((engager) => {
                        return (
                          <TableRow
                            key={engager.profile_url}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              const encodedUrl = encodeURIComponent(engager.profile_url)
                              navigate(`/engagers/${encodedUrl}`)
                            }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {engager.full_name?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">
                                    {engager.full_name || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="text-sm text-muted-foreground truncate">
                                {engager.headline || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="w-[200px]">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-foreground">
                                  {engager.company_name || 'N/A'}
                                </div>
                                {engager.company_industry && (
                                  <div className="text-xs text-muted-foreground">
                                    {engager.company_industry}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[180px]">
                              <div className="text-sm text-muted-foreground">
                                {engager.location || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="w-[120px] text-right">
                              <div className="text-sm font-medium text-foreground">
                                {engager.connections ? formatNumber(engager.connections) : 'N/A'}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
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

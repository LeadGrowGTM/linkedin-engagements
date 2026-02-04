import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, Calendar, CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAllPosts, useRefreshPosts } from '@/hooks/usePosts'
import { formatDate, formatNumber, parseLinkedInUsername } from '@/lib/utils'
import { useTriggerScrapeProfiles, useTriggerScrapeEngagers } from '@/hooks/useTriggerScrape'

export default function Posts() {
  const { data: posts, isLoading, refetch } = useAllPosts()
  const refreshPosts = useRefreshPosts()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { trigger: triggerPosts, isTriggering: isTriggeringPosts, result: postsResult, clearResult: clearPostsResult } = useTriggerScrapeProfiles()
  const { trigger: triggerEngagers, isTriggering: isTriggeringEngagers, result: engagerResult, clearResult: clearEngagerResult } = useTriggerScrapeEngagers()

  useEffect(() => {
    if (postsResult) {
      const timer = setTimeout(clearPostsResult, 4000)
      return () => clearTimeout(timer)
    }
  }, [postsResult, clearPostsResult])

  useEffect(() => {
    if (engagerResult) {
      const timer = setTimeout(clearEngagerResult, 4000)
      return () => clearTimeout(timer)
    }
  }, [engagerResult, clearEngagerResult])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshPosts.mutateAsync()
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'PROCESSED - 1':
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" />Completed</Badge>
      case 'PROCESSING':
        return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" />Processing</Badge>
      case 'PENDING':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>
    }
  }

  // Group posts by profile
  const postsByProfile = posts?.reduce((acc, post) => {
    const url = post.profile_url || 'unknown'
    if (!acc[url]) {
      acc[url] = []
    }
    acc[url].push(post)
    return acc
  }, {} as Record<string, typeof posts>)

  // Calculate engagement stats
  const totalPosts = posts?.length || 0
  const completedPosts = posts?.filter(p => 
    p.status?.toUpperCase() === 'COMPLETED' || p.status?.toUpperCase() === 'PROCESSED - 1'
  ).length || 0
  const processingPosts = posts?.filter(p => p.status?.toUpperCase() === 'PROCESSING').length || 0
  const pendingPosts = posts?.filter(p => p.status?.toUpperCase() === 'PENDING').length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
            All Posts
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            View all posts from monitored LinkedIn profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(postsResult || engagerResult) && (
            <span className={`text-sm ${(postsResult?.success ?? engagerResult?.success) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {postsResult?.message || engagerResult?.message}
            </span>
          )}
          <Button
            variant="outline"
            onClick={triggerPosts}
            disabled={isTriggeringPosts}
            className="gap-2"
          >
            <Zap className={`h-4 w-4 ${isTriggeringPosts ? 'animate-pulse' : ''}`} />
            {isTriggeringPosts ? 'Triggering...' : 'Scrape Posts'}
          </Button>
          <Button
            variant="outline"
            onClick={triggerEngagers}
            disabled={isTriggeringEngagers}
            className="gap-2"
          >
            <Zap className={`h-4 w-4 ${isTriggeringEngagers ? 'animate-pulse' : ''}`} />
            {isTriggeringEngagers ? 'Triggering...' : 'Scrape Engagers'}
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Total Posts
                </p>
                <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                  {formatNumber(totalPosts)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Completed
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(completedPosts)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Processing
                </p>
                <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {formatNumber(processingPosts)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                  Pending
                </p>
                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(pendingPosts)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-navy-200 dark:bg-navy-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-navy-200 dark:bg-navy-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(postsByProfile || {}).map(([profileUrl, profilePosts]) => {
            const username = parseLinkedInUsername(profileUrl)
            return (
              <Card key={profileUrl}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{username}</CardTitle>
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Profile
                        </a>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {profilePosts.length} {profilePosts.length === 1 ? 'Post' : 'Posts'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profilePosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-lg border border-navy-200 dark:border-navy-800 hover:border-navy-300 dark:hover:border-navy-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(post.status)}
                            {post.posted_at_timestamp && (
                              <span className="text-xs text-navy-500 dark:text-navy-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(post.posted_at_timestamp)}
                              </span>
                            )}
                          </div>
                          {post.post_text && (
                            <p className="text-sm text-navy-900 dark:text-navy-50 mb-2 line-clamp-3">
                              {post.post_text}
                            </p>
                          )}
                          <a
                            href={post.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            View on LinkedIn
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-navy-400 dark:text-navy-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-navy-900 dark:text-navy-50">
                No posts found
              </h3>
              <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
                Click "Refresh Posts" to fetch the latest posts from your monitored profiles.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, TrendingUp, Users, Target, Calendar, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePostPerformance } from '@/hooks/usePostPerformance'
import { parseLinkedInUsername, formatDate, formatNumber } from '@/lib/utils'

export default function PostPerformance() {
  const { profileUrl } = useParams<{ profileUrl: string }>()
  const decodedUrl = profileUrl ? decodeURIComponent(profileUrl) : ''
  
  const { data, isLoading } = usePostPerformance(decodedUrl)
  const username = parseLinkedInUsername(decodedUrl)

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

      {/* Info Note */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Profile-Level Engagement Data
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Currently showing all posts for this profile. Per-post engagement tracking requires linking engagers to specific posts in your n8n workflow. 
                The statistics above show aggregate data across all posts for this profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

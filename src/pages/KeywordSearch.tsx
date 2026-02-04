import { useState } from 'react'
import { Search, Users, FileText, ExternalLink, TrendingUp, Calendar, Building2, MapPin, Heart, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useKeywordSearchEngagers, useKeywordSearchPosts } from '@/hooks/useKeywordSearch'
import { formatDate, formatNumber } from '@/lib/utils'

export default function KeywordSearch() {
  const [keyword, setKeyword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: engagers, isLoading: loadingEngagers } = useKeywordSearchEngagers(searchQuery)
  const { data: posts, isLoading: loadingPosts } = useKeywordSearchPosts(searchQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (keyword.trim().length >= 2) {
      setSearchQuery(keyword.trim())
    }
  }

  const totalEngagements = engagers?.reduce((sum, e) => sum + Number(e.engagement_count), 0) || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
          Keyword Search
        </h1>
        <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
          Find people engaging with posts about specific topics
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-navy-400" />
              <Input
                type="text"
                placeholder='Search by keyword (e.g., "AI SDR", "Sales Automation", "SaaS")'
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-10 text-base h-12"
              />
            </div>
            <Button 
              type="submit" 
              size="lg"
              disabled={keyword.trim().length < 2}
              className="px-8"
            >
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
          </form>
          <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
            Enter at least 2 characters to search
          </p>
        </CardContent>
      </Card>

      {/* Results */}
      {searchQuery && (
        <>
          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                      Matching Posts
                    </p>
                    <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                      {formatNumber(posts?.length || 0)}
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
                      {formatNumber(engagers?.length || 0)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
                      Total Engagements
                    </p>
                    <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
                      {formatNumber(totalEngagements)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagers List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                People Engaging with "{searchQuery}"
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEngagers ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-navy-200 dark:bg-navy-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : engagers && engagers.length > 0 ? (
                <div className="space-y-4">
                  {engagers.map((engager) => (
                    <Link
                      key={engager.engager_profile_url}
                      to={`/engagers/${encodeURIComponent(engager.engager_profile_url)}`}
                      className="block p-4 rounded-lg border border-navy-200 dark:border-navy-800 hover:border-primary-500 dark:hover:border-primary-600 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0">
                            <span className="text-white font-semibold text-lg">
                              {engager.engager_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-navy-900 dark:text-navy-50 truncate">
                                {engager.engager_name || 'Unknown'}
                              </h3>
                              {Number(engager.engagement_count) > 1 && (
                                <Badge variant="secondary" className="shrink-0">
                                  {engager.engagement_count}x engaged
                                </Badge>
                              )}
                            </div>

                            {engager.engager_headline && (
                              <p className="text-sm text-navy-600 dark:text-navy-400 mb-2 line-clamp-1">
                                {engager.engager_headline}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500 dark:text-navy-400">
                              {engager.engager_company && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {engager.engager_company}
                                </span>
                              )}
                              {engager.engager_location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {engager.engager_location}
                                </span>
                              )}
                              {engager.latest_engagement && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Last: {formatDate(engager.latest_engagement)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-3 text-center shrink-0">
                          {engager.engager_connections !== null && (
                            <div>
                              <p className="text-sm font-semibold text-navy-900 dark:text-navy-50">
                                {formatNumber(engager.engager_connections)}
                              </p>
                              <p className="text-xs text-navy-500 dark:text-navy-400">
                                Connections
                              </p>
                            </div>
                          )}
                          {engager.engager_followers !== null && (
                            <div>
                              <p className="text-sm font-semibold text-navy-900 dark:text-navy-50">
                                {formatNumber(engager.engager_followers)}
                              </p>
                              <p className="text-xs text-navy-500 dark:text-navy-400">
                                Followers
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-navy-400 dark:text-navy-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-navy-900 dark:text-navy-50">
                    No engagers found
                  </h3>
                  <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
                    No one has engaged with posts containing "{searchQuery}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Matching Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Posts About "{searchQuery}"
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-navy-200 dark:bg-navy-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.map((post, idx) => (
                    <div
                      key={post.post_url || idx}
                      className="p-4 rounded-lg border border-navy-200 dark:border-navy-800"
                    >
                      {post.post_text && (
                        <p className="text-sm text-navy-900 dark:text-navy-50 mb-3 line-clamp-3">
                          {post.post_text}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-xs text-navy-500 dark:text-navy-400">
                          {post.engagement_type && (
                            <Badge
                              variant={post.engagement_type.toLowerCase() === 'like' ? 'secondary' : 'outline'}
                              className="gap-1"
                            >
                              {post.engagement_type.toLowerCase() === 'like' ? (
                                <Heart className="h-3 w-3 text-red-500" />
                              ) : (
                                <MessageCircle className="h-3 w-3 text-blue-500" />
                              )}
                              {post.engagement_type}
                            </Badge>
                          )}
                          {post.engaged_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.engaged_at)}
                            </span>
                          )}
                        </div>
                        <a
                          href={post.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on LinkedIn
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-navy-400 dark:text-navy-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-navy-900 dark:text-navy-50">
                    No posts found
                  </h3>
                  <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
                    No posts contain the keyword "{searchQuery}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!searchQuery && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-navy-900 dark:text-navy-50 mb-2">
                Search by Keyword
              </h3>
              <p className="text-navy-500 dark:text-navy-400 mb-6">
                Enter a keyword to find all the people who have engaged with posts about that topic.
              </p>
              <div className="space-y-2 text-left bg-navy-50 dark:bg-navy-900/50 p-4 rounded-lg">
                <p className="text-sm font-medium text-navy-900 dark:text-navy-50">
                  Example searches:
                </p>
                <ul className="text-sm text-navy-600 dark:text-navy-400 space-y-1">
                  <li>• "AI SDR" - Find people interested in AI sales tools</li>
                  <li>• "SaaS growth" - Discover growth-focused professionals</li>
                  <li>• "Product-led" - Identify PLG advocates</li>
                  <li>• "Fundraising" - Connect with startup founders</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePostPerformance(profileUrl: string) {
  return useQuery({
    queryKey: ['post-performance', profileUrl],
    queryFn: async () => {
      // Get posts for this profile
      const { data: posts, error: postsError } = await supabase
        .from('linkedin_posts')
        .select('*')
        .eq('profile_url', profileUrl)
        .order('posted_at_timestamp', { ascending: false })

      if (postsError) throw postsError

      // Get all engagers for this profile
      const { data: engagers, error: engagersError } = await supabase
        .from('enriched_profiles')
        .select('*')
        .eq('parent_profile', profileUrl)

      if (engagersError) throw engagersError

      // Get post_engagements to map engagers to specific posts
      const postUrls = (posts || []).map(p => p.post_url)
      const { data: postEngagements, error: peError } = postUrls.length > 0
        ? await supabase
            .from('post_engagements')
            .select('engager_profile_url, post_url, engagement_type')
            .in('post_url', postUrls)
        : { data: [], error: null }

      if (peError) throw peError

      // Build a map of post_url -> engager profile URLs
      const postEngagerMap = new Map<string, Set<string>>()
      ;(postEngagements || []).forEach(pe => {
        if (!postEngagerMap.has(pe.post_url)) {
          postEngagerMap.set(pe.post_url, new Set())
        }
        postEngagerMap.get(pe.post_url)!.add(pe.engager_profile_url)
      })

      // Build a lookup of engagers by profile URL
      const engagerLookup = new Map<string, typeof engagers[0]>()
      ;(engagers || []).forEach(e => {
        engagerLookup.set(e.profile_url, e)
      })

      const allEngagers = engagers || []

      // Industry breakdown
      const industryMap = new Map<string, number>()
      allEngagers.forEach(e => {
        if (e.company_industry) {
          industryMap.set(e.company_industry, (industryMap.get(e.company_industry) || 0) + 1)
        }
      })
      const industryBreakdown = Array.from(industryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      // Company size breakdown
      const sizeMap = new Map<string, number>()
      allEngagers.forEach(e => {
        if (e.company_size) {
          sizeMap.set(e.company_size, (sizeMap.get(e.company_size) || 0) + 1)
        }
      })
      const companySizeBreakdown = Array.from(sizeMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

      // Location breakdown
      const locationMap = new Map<string, number>()
      allEngagers.forEach(e => {
        if (e.location) {
          locationMap.set(e.location, (locationMap.get(e.location) || 0) + 1)
        }
      })
      const locationBreakdown = Array.from(locationMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      // Sort all engagers by connections (or recent engagement)
      const sortedEngagers = allEngagers
        .sort((a, b) => (b.connections || 0) - (a.connections || 0))
      
      // Top engagers by connections (for the overview cards)
      const topEngagers = sortedEngagers.slice(0, 10)

      // Engagement timeline (last 30 days)
      const timelineMap = new Map<string, number>()
      allEngagers.forEach(e => {
        if (e.created_at) {
          const date = new Date(e.created_at).toISOString().split('T')[0]
          timelineMap.set(date, (timelineMap.get(date) || 0) + 1)
        }
      })
      const engagementTimeline = Array.from(timelineMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30)

      // Map posts with per-post engagers
      const postsData = (posts || []).map(post => {
        const engagerUrls = postEngagerMap.get(post.post_url) || new Set<string>()
        const postEngagers = Array.from(engagerUrls)
          .map(url => engagerLookup.get(url))
          .filter((e): e is NonNullable<typeof e> => Boolean(e))
        return {
          ...post,
          engagers: postEngagers,
        }
      })

      return {
        posts: postsData,
        totalEngagers: allEngagers.length,
        totalPosts: posts?.length || 0,
        industryBreakdown,
        companySizeBreakdown,
        locationBreakdown,
        topEngagers,
        allEngagers: sortedEngagers,
        engagementTimeline,
      }
    },
  })
}

export function useUpdatePostStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ postId, status }: { postId: number; status: string }) => {
      const { data, error } = await supabase
        .from('linkedin_posts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-performance'] })
    },
  })
}


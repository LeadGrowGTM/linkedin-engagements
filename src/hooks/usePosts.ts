import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Post = Database['linkedin']['Tables']['linkedin_posts']['Row']

export function useAllPosts() {
  return useQuery({
    queryKey: ['all-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linkedin_posts')
        .select('*')
        .order('posted_at_timestamp', { ascending: false })

      if (error) throw error
      return data as Post[]
    },
  })
}

export function usePostsByProfile(profileUrl: string) {
  return useQuery({
    queryKey: ['posts-by-profile', profileUrl],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linkedin_posts')
        .select('*')
        .eq('profile_url', profileUrl)
        .order('posted_at_timestamp', { ascending: false })

      if (error) throw error
      return data as Post[]
    },
  })
}

export function useRefreshPosts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Refetch posts data from Supabase
      // Use the Settings page to trigger scraping via the API server
      
      // Invalidate and refetch posts
      await queryClient.invalidateQueries({ queryKey: ['all-posts'] })
      await queryClient.invalidateQueries({ queryKey: ['posts-by-profile'] })
      
      return { success: true }
    },
    onSuccess: () => {
      // Show success message (could add toast notification here)
      console.log('Posts refreshed successfully')
    },
  })
}

// Get posts with engagement counts
export function usePostsWithEngagement() {
  return useQuery({
    queryKey: ['posts-with-engagement'],
    queryFn: async () => {
      // Get all posts
      const { data: posts, error: postsError } = await supabase
        .from('linkedin_posts')
        .select('*')
        .order('posted_at_timestamp', { ascending: false })

      if (postsError) throw postsError

      // Get engagement counts for each post
      const { data: engagers, error: engagersError } = await supabase
        .from('enriched_profiles')
        .select('parent_profile')
        .not('parent_profile', 'is', null)

      if (engagersError) throw engagersError

      // Count engagers per post's parent profile
      const engagementCounts = (engagers || []).reduce((acc, engager) => {
        const profile = engager.parent_profile || ''
        acc[profile] = (acc[profile] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Attach engagement counts to posts
      const postsWithEngagement = (posts || []).map(post => ({
        ...post,
        engagementCount: engagementCounts[post.profile_url || ''] || 0,
      }))

      return postsWithEngagement
    },
  })
}


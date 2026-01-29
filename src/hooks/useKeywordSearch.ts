import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface KeywordSearchResult {
  engager_profile_url: string
  engager_name: string | null
  engager_headline: string | null
  engager_company: string | null
  engager_location: string | null
  engager_connections: number | null
  engager_followers: number | null
  post_url: string
  post_text: string | null
  monitored_profile_url: string
  engaged_at: string | null
  engagement_count: number // How many posts with this keyword they engaged with
}

export function useKeywordSearch(keyword: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['keywordSearch', keyword],
    queryFn: async () => {
      if (!keyword || keyword.trim().length < 2) {
        return []
      }

      // Use PostgreSQL full-text search for better performance
      const { data, error } = await supabase
        .rpc('search_engagers_by_keyword', {
          search_keyword: keyword.trim()
        })

      if (error) {
        console.error('Error searching by keyword:', error)
        throw error
      }

      return (data || []) as KeywordSearchResult[]
    },
    enabled: enabled && keyword.trim().length >= 2,
    staleTime: 30000, // 30 seconds
  })
}

// Get unique engagers from keyword search (grouped by person)
export function useKeywordSearchEngagers(keyword: string) {
  return useQuery({
    queryKey: ['keywordSearchEngagers', keyword],
    queryFn: async () => {
      if (!keyword || keyword.trim().length < 2) {
        return []
      }

      const { data, error } = await supabase
        .rpc('search_engagers_by_keyword_grouped', {
          search_keyword: keyword.trim()
        })

      if (error) {
        console.error('Error searching engagers:', error)
        throw error
      }

      return (data || []) as Array<{
        engager_profile_url: string
        engager_name: string | null
        engager_headline: string | null
        engager_company: string | null
        engager_location: string | null
        engager_connections: number | null
        engager_followers: number | null
        engagement_count: number
        latest_engagement: string | null
        post_urls: string[]
      }>
    },
    enabled: keyword.trim().length >= 2,
    staleTime: 30000,
  })
}

// Get posts matching a keyword
export function useKeywordSearchPosts(keyword: string) {
  return useQuery({
    queryKey: ['keywordSearchPosts', keyword],
    queryFn: async () => {
      if (!keyword || keyword.trim().length < 2) {
        return []
      }

      const { data, error } = await supabase
        .from('post_engagements')
        .select(`
          post_url,
          post_text,
          monitored_profile_url,
          engaged_at,
          engagement_type
        `)
        .ilike('post_text', `%${keyword.trim()}%`)
        .order('engaged_at', { ascending: false })

      if (error) {
        console.error('Error searching posts:', error)
        throw error
      }

      // Get unique posts (keep first occurrence which has engagement_type)
      const uniquePosts = Array.from(
        new Map(data.map(item => [item.post_url, item])).values()
      )

      return uniquePosts
    },
    enabled: keyword.trim().length >= 2,
    staleTime: 30000,
  })
}


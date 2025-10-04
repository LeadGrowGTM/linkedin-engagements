import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { calculateLeadScore } from '@/lib/leadScoring'

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

      // Calculate overall average lead score for the profile
      let totalScore = 0
      const allEngagers = engagers || []
      allEngagers.forEach(engager => {
        const scoreComponents = calculateLeadScore({
          connections: engager.connections,
          followers: engager.followers,
          company_size: engager.company_size,
          headline: engager.headline,
        })
        totalScore += scoreComponents.totalScore
      })

      const avgLeadScore = allEngagers.length > 0 ? Math.round(totalScore / allEngagers.length) : 0

      // Map posts without per-post stats (since we don't have that data)
      const postsData = (posts || []).map(post => ({
        ...post,
      }))

      return {
        posts: postsData,
        totalEngagers: allEngagers.length,
        totalPosts: posts?.length || 0,
        avgLeadScore,
      }
    },
  })
}


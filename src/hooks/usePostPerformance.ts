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

      const allEngagers = engagers || []

      // Calculate lead scores and categorize engagers
      const engagersWithScores = allEngagers.map(engager => {
        const scoreComponents = calculateLeadScore({
          connections: engager.connections,
          followers: engager.followers,
          company_size: engager.company_size,
          headline: engager.headline,
        })
        return {
          ...engager,
          leadScore: scoreComponents.totalScore,
          leadCategory: scoreComponents.totalScore >= 70 ? 'Hot' : scoreComponents.totalScore >= 40 ? 'Warm' : 'Cold'
        }
      })

      // Calculate average lead score
      const totalScore = engagersWithScores.reduce((sum, e) => sum + e.leadScore, 0)
      const avgLeadScore = allEngagers.length > 0 ? Math.round(totalScore / allEngagers.length) : 0

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

      // Lead quality distribution
      const leadQuality = {
        hot: engagersWithScores.filter(e => e.leadCategory === 'Hot').length,
        warm: engagersWithScores.filter(e => e.leadCategory === 'Warm').length,
        cold: engagersWithScores.filter(e => e.leadCategory === 'Cold').length,
      }

      // Top engagers by lead score
      const topEngagers = engagersWithScores
        .sort((a, b) => b.leadScore - a.leadScore)
        .slice(0, 10)

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

      // Map posts
      const postsData = (posts || []).map(post => ({
        ...post,
      }))

      return {
        posts: postsData,
        totalEngagers: allEngagers.length,
        totalPosts: posts?.length || 0,
        avgLeadScore,
        industryBreakdown,
        companySizeBreakdown,
        locationBreakdown,
        leadQuality,
        topEngagers,
        engagementTimeline,
      }
    },
  })
}


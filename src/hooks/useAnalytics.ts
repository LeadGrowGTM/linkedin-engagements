import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TimeRange } from './useDashboard'

export function useIndustryDistribution(timeRange: TimeRange = 30) {
  return useQuery({
    queryKey: ['industry-distribution', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)

      const { data, error } = await supabase
        .from('enriched_profiles')
        .select('company_industry')
        .gte('created_at', cutoffDate.toISOString())
        .not('company_industry', 'is', null)

      if (error) throw error

      // Count industries
      const industryCounts = new Map<string, number>()
      ;(data || []).forEach(item => {
        if (item.company_industry) {
          const count = industryCounts.get(item.company_industry) || 0
          industryCounts.set(item.company_industry, count + 1)
        }
      })

      // Convert to array and sort
      const distribution = Array.from(industryCounts.entries())
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count)

      return distribution
    },
  })
}

export function useCompanySizeDistribution(timeRange: TimeRange = 30) {
  return useQuery({
    queryKey: ['company-size-distribution', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)

      const { data, error } = await supabase
        .from('enriched_profiles')
        .select('company_size')
        .gte('created_at', cutoffDate.toISOString())
        .not('company_size', 'is', null)

      if (error) throw error

      // Count sizes
      const sizeCounts = new Map<string, number>()
      ;(data || []).forEach(item => {
        if (item.company_size) {
          const count = sizeCounts.get(item.company_size) || 0
          sizeCounts.set(item.company_size, count + 1)
        }
      })

      // Convert to array
      const distribution = Array.from(sizeCounts.entries())
        .map(([size, count]) => ({ size, count }))
        .sort((a, b) => b.count - a.count)

      return distribution
    },
  })
}

export function useLocationDistribution(timeRange: TimeRange = 30) {
  return useQuery({
    queryKey: ['location-distribution', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)

      const { data, error} = await supabase
        .from('enriched_profiles')
        .select('location')
        .gte('created_at', cutoffDate.toISOString())
        .not('location', 'is', null)

      if (error) throw error

      // Count locations
      const locationCounts = new Map<string, number>()
      ;(data || []).forEach(item => {
        if (item.location) {
          const count = locationCounts.get(item.location) || 0
          locationCounts.set(item.location, count + 1)
        }
      })

      // Convert to array and get top 10
      const distribution = Array.from(locationCounts.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      return distribution
    },
  })
}

export function useSkillsDistribution(timeRange: TimeRange = 30) {
  return useQuery({
    queryKey: ['skills-distribution', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)

      const { data, error } = await supabase
        .from('enriched_profiles')
        .select('skills')
        .gte('created_at', cutoffDate.toISOString())
        .not('skills', 'is', null)

      if (error) throw error

      // Count skills
      const skillCounts = new Map<string, number>()
      ;(data || []).forEach(item => {
        if (item.skills && Array.isArray(item.skills)) {
          item.skills.forEach((skill: any) => {
            const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill
            if (skillName) {
              const count = skillCounts.get(skillName) || 0
              skillCounts.set(skillName, count + 1)
            }
          })
        }
      })

      // Convert to array and get top 50
      const distribution = Array.from(skillCounts.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50)

      return distribution
    },
  })
}

export function useEngagementTrends(timeRange: TimeRange = 30) {
  return useQuery({
    queryKey: ['engagement-trends', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)

      const { data, error } = await supabase
        .from('enriched_profiles')
        .select('created_at, parent_profile')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by date
      const trendsByDate = new Map<string, number>()
      ;(data || []).forEach(item => {
        if (item.created_at) {
          const date = new Date(item.created_at).toISOString().split('T')[0]
          const count = trendsByDate.get(date) || 0
          trendsByDate.set(date, count + 1)
        }
      })

      // Convert to array
      const trends = Array.from(trendsByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return trends
    },
  })
}

export function useEngagementPatterns() {
  return useQuery({
    queryKey: ['engagement-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enriched_profiles')
        .select('created_at')
        .not('created_at', 'is', null)

      if (error) throw error

      // Create day of week × hour heatmap data
      const patterns: { [key: string]: { [key: string]: number } } = {}
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

      // Initialize
      daysOfWeek.forEach(day => {
        patterns[day] = {}
        for (let hour = 0; hour < 24; hour++) {
          patterns[day][hour] = 0
        }
      })

      // Count engagements
      ;(data || []).forEach(item => {
        if (item.created_at) {
          const date = new Date(item.created_at)
          const day = daysOfWeek[date.getDay()]
          const hour = date.getHours()
          patterns[day][hour]++
        }
      })

      return patterns
    },
  })
}

export function useTopTitles(timeRange: TimeRange = 30) {
  return useQuery({
    queryKey: ['top-titles', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)

      // Check if enriched_profiles has any data with headlines
      const { error: profilesError } = await supabase
        .from('enriched_profiles')
        .select('headline, full_name, company_name')
        .not('headline', 'is', null)
        .limit(1)

      if (profilesError) throw profilesError

      // Check recent engagements
      const { data: recentEngagements, error: engagementError } = await supabase
        .from('post_engagements')
        .select('engager_profile_url, engaged_at')
        .gte('engaged_at', cutoffDate.toISOString())
        .limit(50)

      if (engagementError) throw engagementError

      // Now try to get enriched profiles for these engager URLs
      if (recentEngagements && recentEngagements.length > 0) {
        const engagerUrls = recentEngagements.map(e => e.engager_profile_url)

        const { data: enrichedEngagers, error: enrichError } = await supabase
          .from('enriched_profiles')
          .select('profile_url, headline, full_name, company_name, experiences')
          .in('profile_url', engagerUrls)

        if (enrichError) throw enrichError

        // Count titles using multiple fallback fields
        const titleCounts = new Map<string, number>()

        ;(enrichedEngagers || []).forEach(profile => {
          let title = null

          if (profile.headline && profile.headline.trim()) {
            title = profile.headline
          } else if (profile.full_name && profile.full_name.trim()) {
            title = profile.full_name
          } else if (profile.company_name && profile.company_name.trim()) {
            title = profile.company_name
          } else if (profile.experiences && Array.isArray(profile.experiences)) {
            const currentPosition = profile.experiences.find((exp: any) =>
              exp.current === true || exp.current === 1 || exp.current === 'true' || exp.current === '1'
            )
            if (currentPosition?.title) {
              title = currentPosition.title
            }
          }

          if (title && title.trim()) {
            const count = titleCounts.get(title) || 0
            titleCounts.set(title, count + 1)
          }
        })

        // Convert to array and sort
        const distribution = Array.from(titleCounts.entries())
          .map(([title, count]) => ({ title, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        return distribution
      }

      // If no enriched profiles found for engagers, try to get any enriched profiles as fallback
      const { data: fallbackProfiles, error: fallbackError } = await supabase
        .from('enriched_profiles')
        .select('headline, full_name, company_name')
        .not('headline', 'is', null)
        .not('full_name', 'is', null)
        .limit(20)

      if (fallbackError) throw fallbackError

      if (fallbackProfiles && fallbackProfiles.length > 0) {
        const titleCounts = new Map<string, number>()

        ;(fallbackProfiles || []).forEach(profile => {
          let title = null

          if (profile.headline && profile.headline.trim()) {
            title = profile.headline
          } else if (profile.full_name && profile.full_name.trim()) {
            title = profile.full_name
          } else if (profile.company_name && profile.company_name.trim()) {
            title = profile.company_name
          }

          if (title && title.trim()) {
            const count = titleCounts.get(title) || 0
            titleCounts.set(title, count + 1)
          }
        })

        const distribution = Array.from(titleCounts.entries())
          .map(([title, count]) => ({ title, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        return distribution
      }

      // Return empty array if no data found
      return []
    },
  })
}


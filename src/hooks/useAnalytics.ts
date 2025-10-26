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


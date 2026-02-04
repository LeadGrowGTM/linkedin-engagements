import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { parseLinkedInUsername } from '@/lib/utils'

export type TimeRange = 7 | 14 | 30 | 90

export function useDashboardMetrics(timeRange: TimeRange = 7) {
  return useQuery({
    queryKey: ['dashboard-metrics', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)

      // Get active profiles count
      const { count: activeProfiles, error: profilesError } = await supabase
        .from('linkedin_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_enabled', true)

      if (profilesError) throw profilesError

      // Get posts count (with time filter)
      const { count: totalPosts, error: postsError } = await supabase
        .from('linkedin_posts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', cutoffDate.toISOString())

      if (postsError) throw postsError

      // Get unique engagers count (with time filter)
      const { data: engagers, error: engagersError } = await supabase
        .from('enriched_profiles')
        .select('profile_url')
        .gte('created_at', cutoffDate.toISOString())

      if (engagersError) throw engagersError

      const uniqueEngagers = new Set((engagers || []).map(e => e.profile_url)).size

      // Calculate engagement rate
      const engagementRate = totalPosts && totalPosts > 0 
        ? (uniqueEngagers / totalPosts) 
        : 0

      return {
        activeProfiles: activeProfiles || 0,
        totalPosts: totalPosts || 0,
        uniqueEngagers,
        engagementRate,
      }
    },
  })
}

export function useEngagersTracked(timeRange: TimeRange = 7) {
  return useQuery({
    queryKey: ['engagers-tracked', timeRange],
    queryFn: async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)

      // Get enriched profiles (engagers) with time filter, sorted by most recent
      const { data: engagers, error: engagersError } = await supabase
        .from('enriched_profiles')
        .select('*')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })

      if (engagersError) throw engagersError

      // Get ALL engagers (not time-filtered) to count repeat engagements
      const { data: allEngagers } = await supabase
        .from('enriched_profiles')
        .select('profile_url, parent_profile')

      // Create engagement count map
      const engagementCounts = new Map<string, number>()
      ;(allEngagers || []).forEach(e => {
        const count = engagementCounts.get(e.profile_url) || 0
        engagementCounts.set(e.profile_url, count + 1)
      })

      // Map engagers to the format needed for the table
      const engagersData = (engagers || []).map(engager => {
        // Parse the LinkedIn username from the engager's profile URL
        const username = parseLinkedInUsername(engager.profile_url)
        
        // Parse the parent profile username
        const parentUsername = engager.parent_profile 
          ? parseLinkedInUsername(engager.parent_profile)
          : 'N/A'

        // Generate smart tags based on engager data
        const smartTags = [
          engager.company_industry,
          engager.location,
          engager.company_size,
        ].filter(Boolean) as string[]

        // Get engagement count
        const engagementCount = engagementCounts.get(engager.profile_url) || 1

        return {
          id: engager.profile_url, // Use profile_url as unique ID
          profileUrl: engager.profile_url,
          urn: engager.urn,
          publicIdentifier: engager.public_identifier,
          fullName: engager.full_name || engager.first_name || username,
          firstName: engager.first_name,
          lastName: engager.last_name,
          headline: engager.headline || 'N/A',
          about: engager.about,
          companyName: engager.company_name || 'N/A',
          companyLinkedinUrl: engager.company_linkedin_url,
          companyWebsite: engager.company_website,
          companyIndustry: engager.company_industry,
          companySize: engager.company_size,
          location: engager.location,
          connections: engager.connections,
          followers: engager.followers,
          skills: engager.skills,
          experiences: engager.experiences || engager.experience,
          educations: engager.educations,
          updates: engager.updates,
          licenseAndCertificates: engager.licenseAndCertificates,
          honorsAndAwards: engager.honorsAndAwards,
          languages: engager.languages,
          volunteerAndAwards: engager.volunteerAndAwards,
          organizations: engager.organizations,
          totalTenureMonths: engager.totalTenureMonths,
          totalTenureDays: engager.totalTenureDays,
          parentProfile: engager.parent_profile || null,
          parentProfileUsername: parentUsername,
          smartTags: smartTags.slice(0, 3), // Show up to 3 tags
          engagementCount,
          createdAt: engager.created_at,
          lastEnrichedAt: engager.last_enriched_at,
          rawData: engager.raw_data,
          engagementType: engager.engagement_type,
          engagementValue: engager.engagement_value,
        }
      })

      // Sort by engagement count (highest first), then by most recent
      return engagersData.sort((a, b) => {
        if (b.engagementCount !== a.engagementCount) {
          return b.engagementCount - a.engagementCount
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      })
    },
  })
}


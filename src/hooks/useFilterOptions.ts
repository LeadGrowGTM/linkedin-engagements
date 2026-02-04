import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { parseLinkedInUsername } from '@/lib/utils'

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      // Get unique industries
      const { data: industries } = await supabase
        .from('enriched_profiles')
        .select('company_industry')
        .not('company_industry', 'is', null)

      // Get unique locations
      const { data: locations } = await supabase
        .from('enriched_profiles')
        .select('location')
        .not('location', 'is', null)

      // Get monitored profiles
      const { data: profiles } = await supabase
        .from('linkedin_profiles')
        .select('profile_url')

      // Process unique values
      const uniqueIndustries = Array.from(
        new Set((industries || []).map(i => i.company_industry).filter(Boolean))
      ).sort()

      const uniqueLocations = Array.from(
        new Set((locations || []).map(l => l.location).filter(Boolean))
      ).sort()

      const monitoredProfiles = (profiles || []).map(p => ({
        url: p.profile_url,
        name: parseLinkedInUsername(p.profile_url),
      }))

      return {
        industries: uniqueIndustries as string[],
        locations: uniqueLocations as string[],
        profiles: monitoredProfiles,
      }
    },
  })
}


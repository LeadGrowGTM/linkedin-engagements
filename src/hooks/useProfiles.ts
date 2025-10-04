import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Profile = Database['linkedinengagements']['Tables']['linkedin_profiles']['Row']
type ProfileInsert = Database['linkedinengagements']['Tables']['linkedin_profiles']['Insert']
type ProfileUpdate = Database['linkedinengagements']['Tables']['linkedin_profiles']['Update']

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linkedin_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useProfileStats() {
  return useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      // Get profiles with post counts and engager counts
      const { data: profiles, error: profilesError } = await supabase
        .from('linkedin_profiles')
        .select('*')

      if (profilesError) throw profilesError

      // Get post counts for each profile
      const { data: posts, error: postsError } = await supabase
        .from('linkedin_posts')
        .select('profile_url')

      if (postsError) throw postsError

      // Get engager counts (enriched profiles with parent_profile)
      const { data: engagers, error: engagersError } = await supabase
        .from('enriched_profiles')
        .select('parent_profile')
        .not('parent_profile', 'is', null)

      if (engagersError) throw engagersError

      // Calculate stats for each profile
      const stats = (profiles || []).map(profile => {
        const postCount = (posts || []).filter(p => p.profile_url === profile.profile_url).length
        const engagerCount = (engagers || []).filter(e => e.parent_profile === profile.profile_url).length
        return {
          ...profile,
          postCount,
          engagerCount,
        }
      })

      return stats
    },
  })
}

export function useAddProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profile: ProfileInsert) => {
      const { data, error } = await supabase
        .from('linkedin_profiles')
        .insert([profile])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProfileUpdate & { id: number }) => {
      const { data, error } = await supabase
        .from('linkedin_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('linkedin_profiles')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
    },
  })
}


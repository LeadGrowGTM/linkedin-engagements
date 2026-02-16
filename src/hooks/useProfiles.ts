import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Profile = Database['linkedin']['Tables']['linkedin_profiles']['Row']
type ProfileInsert = Database['linkedin']['Tables']['linkedin_profiles']['Insert']
type ProfileUpdate = Database['linkedin']['Tables']['linkedin_profiles']['Update']

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
      const { data: profiles, error: profilesError } = await supabase
        .from('linkedin_profiles')
        .select('*')

      if (profilesError) throw profilesError

      // Count posts and engagers per profile using server-side counts
      // (avoids Supabase default 1000-row limit on bulk fetches)
      const stats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const [{ count: postCount }, { count: engagerCount }] = await Promise.all([
            supabase
              .from('linkedin_posts')
              .select('*', { count: 'exact', head: true })
              .eq('profile_url', profile.profile_url),
            supabase
              .from('enriched_profiles')
              .select('*', { count: 'exact', head: true })
              .eq('parent_profile', profile.profile_url),
          ])
          return {
            ...profile,
            postCount: postCount || 0,
            engagerCount: engagerCount || 0,
          }
        })
      )

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


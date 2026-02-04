import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeProfiles() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('linkedin_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'linkedin',
          table: 'linkedin_profiles',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['profiles'] })
          queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
          queryClient.invalidateQueries({ queryKey: ['engagers-tracked'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}

export function useRealtimePosts() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('linkedin_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'linkedin',
          table: 'linkedin_posts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
          queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}

export function useRealtimeEngagers() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('enriched_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'linkedin',
          table: 'enriched_profiles',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
          queryClient.invalidateQueries({ queryKey: ['engagers-tracked'] })
          queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}

export function useRealtimeAll() {
  useRealtimeProfiles()
  useRealtimePosts()
  useRealtimeEngagers()
}


import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatLeadPayload, type LeadData } from '@/lib/format-lead-payload'

const CLAY_PROXY_URL = import.meta.env.VITE_CLAY_PROXY_URL || ''

function getProxyUrl(): string {
  if (CLAY_PROXY_URL) return CLAY_PROXY_URL
  try {
    const saved = localStorage.getItem('app-settings')
    const settings = saved ? JSON.parse(saved) : {}
    return settings.clayProxyUrl || ''
  } catch {
    return ''
  }
}

interface PushToWebhookResult {
  success: boolean
  message: string
  engagerCount: number
  webhookCount: number
  successCount: number
  failCount: number
}

export function usePushToWebhook() {
  const [isPushing, setIsPushing] = useState(false)

  const pushProfileEngagers = useCallback(async (
    profileUrl: string,
    webhookUrls: string[]
  ): Promise<PushToWebhookResult> => {
    const proxyUrl = getProxyUrl()
    if (!proxyUrl || !proxyUrl.trim()) {
      return {
        success: false,
        message: 'No Clay Proxy URL configured. Set it in Settings or VITE_CLAY_PROXY_URL.',
        engagerCount: 0, webhookCount: 0, successCount: 0, failCount: 0,
      }
    }

    const validUrls = webhookUrls.filter(u => u && u.trim())
    if (validUrls.length === 0) {
      return {
        success: false,
        message: 'No webhook URLs configured on this profile.',
        engagerCount: 0, webhookCount: 0, successCount: 0, failCount: 0,
      }
    }

    setIsPushing(true)
    try {
      // Fetch all engagers for this profile
      const { data: engagers, error } = await supabase
        .from('enriched_profiles')
        .select('*')
        .eq('parent_profile', profileUrl)

      if (error) throw error
      if (!engagers || engagers.length === 0) {
        return {
          success: false,
          message: 'No engagers found for this profile.',
          engagerCount: 0, webhookCount: validUrls.length, successCount: 0, failCount: 0,
        }
      }

      // Fetch post engagements for all engagers in this profile
      const engagerUrls = engagers.map(e => e.profile_url)
      const { data: postEngagements } = await supabase
        .from('post_engagements')
        .select('engager_profile_url, post_url, post_text, engagement_type')
        .in('engager_profile_url', engagerUrls)

      // Group engagements by engager
      const engagementsByEngager = new Map<string, { post_url: string; post_text: string | null; engagement_type: string | null }[]>()
      for (const pe of postEngagements || []) {
        const list = engagementsByEngager.get(pe.engager_profile_url) || []
        list.push({ post_url: pe.post_url, post_text: pe.post_text, engagement_type: pe.engagement_type })
        engagementsByEngager.set(pe.engager_profile_url, list)
      }

      // Format as lead payloads with engagement data
      const leads = engagers.map(e => formatLeadPayload({
        ...(e as LeadData),
        engagements: engagementsByEngager.get(e.profile_url) || [],
      }))

      // Push to each webhook URL via clay-proxy /push/batch
      const batchUrl = proxyUrl.trim().replace(/\/push\/?$/, '/push/batch')
      let totalSuccess = 0
      let totalFail = 0

      for (const webhookUrl of validUrls) {
        try {
          const response = await fetch(batchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leads,
              _clayWebhookUrl: webhookUrl.trim(),
            }),
          })
          const data = await response.json()
          if (response.ok && data.success) {
            totalSuccess += data.successCount || leads.length
          } else {
            totalFail += leads.length
          }
        } catch {
          totalFail += leads.length
        }
      }

      const allSucceeded = totalFail === 0
      const message = allSucceeded
        ? `Pushed ${engagers.length} engagers to ${validUrls.length} webhook${validUrls.length > 1 ? 's' : ''}`
        : `Pushed to webhooks: ${totalSuccess} succeeded, ${totalFail} failed`

      return {
        success: allSucceeded,
        message,
        engagerCount: engagers.length,
        webhookCount: validUrls.length,
        successCount: totalSuccess,
        failCount: totalFail,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        message: `Failed to push: ${msg}`,
        engagerCount: 0, webhookCount: 0, successCount: 0, failCount: 0,
      }
    } finally {
      setIsPushing(false)
    }
  }, [])

  return { pushProfileEngagers, isPushing }
}

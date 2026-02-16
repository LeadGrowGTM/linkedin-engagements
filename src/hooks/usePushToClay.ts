import { useState, useCallback } from 'react'
import { formatLeadPayload, type LeadData } from '@/lib/format-lead-payload'

interface PushResult {
  success: boolean
  message: string
}

// Proxy URL from environment variable (set in Railway)
const CLAY_PROXY_URL = import.meta.env.VITE_CLAY_PROXY_URL || ''

function getSettings() {
  try {
    const saved = localStorage.getItem('app-settings')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export function usePushToClay() {
  const [isPushing, setIsPushing] = useState(false)

  const pushLead = useCallback(async (lead: LeadData): Promise<PushResult> => {
    const settings = getSettings()
    const proxyUrl = CLAY_PROXY_URL || settings.clayProxyUrl // Env var takes priority
    const clayWebhookUrl = settings.clayWebhookUrl

    if (!proxyUrl || !proxyUrl.trim()) {
      return { success: false, message: 'No Clay Proxy URL configured. Set VITE_CLAY_PROXY_URL in Railway.' }
    }

    if (!clayWebhookUrl || !clayWebhookUrl.trim()) {
      return { success: false, message: 'No Clay Webhook URL configured. Set it in Settings.' }
    }

    setIsPushing(true)
    try {
      const payload = {
        ...formatLeadPayload(lead),
        _clayWebhookUrl: clayWebhookUrl.trim(), // Pass webhook URL to proxy
      }

      const response = await fetch(proxyUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return { success: false, message: data.error || `Proxy returned ${response.status}` }
      }

      return { success: true, message: 'Lead pushed to Clay successfully' }
    } catch (error) {
      console.error('Push to Clay error:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error'

      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return {
          success: false,
          message: 'Connection error: Check your Clay Proxy URL'
        }
      }

      return { success: false, message: `Failed to push to Clay: ${msg}` }
    } finally {
      setIsPushing(false)
    }
  }, [])

  const pushMultipleLeads = useCallback(async (leads: LeadData[]): Promise<PushResult> => {
    const settings = getSettings()
    const proxyUrl = CLAY_PROXY_URL || settings.clayProxyUrl // Env var takes priority
    const clayWebhookUrl = settings.clayWebhookUrl

    if (!proxyUrl || !proxyUrl.trim()) {
      return { success: false, message: 'No Clay Proxy URL configured. Set VITE_CLAY_PROXY_URL in Railway.' }
    }

    if (!clayWebhookUrl || !clayWebhookUrl.trim()) {
      return { success: false, message: 'No Clay Webhook URL configured. Set it in Settings.' }
    }

    setIsPushing(true)
    try {
      // Use batch endpoint
      const batchUrl = proxyUrl.trim().replace(/\/push\/?$/, '/push/batch')

      const response = await fetch(batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: leads.map(formatLeadPayload),
          _clayWebhookUrl: clayWebhookUrl.trim(), // Pass webhook URL to proxy
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.error || `Proxy returned ${response.status}` }
      }

      return {
        success: data.success,
        message: data.message || `Pushed ${data.successCount || 0} leads`
      }
    } catch (error) {
      console.error('Push to Clay error:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error'

      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return {
          success: false,
          message: 'Connection error: Check your Clay Proxy URL'
        }
      }

      return { success: false, message: `Failed to push: ${msg}` }
    } finally {
      setIsPushing(false)
    }
  }, [])

  return { pushLead, pushMultipleLeads, isPushing }
}

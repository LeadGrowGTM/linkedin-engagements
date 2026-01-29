import { useState, useCallback } from 'react'

interface LeadData {
  profile_url: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  headline?: string | null
  company_name?: string | null
  company_linkedin_url?: string | null
  company_website?: string | null
  company_industry?: string | null
  company_size?: string | null
  location?: string | null
  connections?: number | null
  followers?: number | null
  about?: string | null
  skills?: unknown
  experiences?: unknown
  educations?: unknown
}

interface PushResult {
  success: boolean
  message: string
}

function getSettings() {
  try {
    const saved = localStorage.getItem('app-settings')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function formatLeadPayload(lead: LeadData) {
  return {
    linkedin_url: lead.profile_url,
    full_name: lead.full_name,
    first_name: lead.first_name,
    last_name: lead.last_name,
    headline: lead.headline,
    company_name: lead.company_name,
    company_linkedin_url: lead.company_linkedin_url,
    company_website: lead.company_website,
    company_industry: lead.company_industry,
    company_size: lead.company_size,
    location: lead.location,
    connections: lead.connections,
    followers: lead.followers,
    about: lead.about,
    skills: lead.skills,
    experiences: lead.experiences,
    educations: lead.educations,
    pushed_at: new Date().toISOString(),
  }
}

export function usePushToClay() {
  const [isPushing, setIsPushing] = useState(false)

  const pushLead = useCallback(async (lead: LeadData): Promise<PushResult> => {
    const settings = getSettings()
    const webhookUrl = settings.clayWebhook

    if (!webhookUrl || !webhookUrl.trim()) {
      return { success: false, message: 'No Clay webhook URL configured. Set it in Settings.' }
    }

    setIsPushing(true)
    try {
      const payload = formatLeadPayload(lead)

      // Check if using proxy (URL ends with /push or contains 'proxy')
      const isProxy = webhookUrl.includes('/push') || webhookUrl.includes('proxy')

      if (isProxy) {
        // Using proxy service
        const response = await fetch(webhookUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          return { success: false, message: data.error || `Proxy returned ${response.status}` }
        }

        return { success: true, message: 'Lead pushed to Clay successfully' }
      } else {
        // Direct to Clay (might fail due to CORS)
        const response = await fetch(webhookUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          return { success: false, message: `Clay webhook returned ${response.status}` }
        }

        return { success: true, message: 'Lead pushed to Clay successfully' }
      }
    } catch (error) {
      console.error('Push to Clay error:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error'

      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return {
          success: false,
          message: 'CORS error: Use the clay-proxy service URL instead of Clay directly'
        }
      }

      return { success: false, message: `Failed to push to Clay: ${msg}` }
    } finally {
      setIsPushing(false)
    }
  }, [])

  const pushMultipleLeads = useCallback(async (leads: LeadData[]): Promise<PushResult> => {
    const settings = getSettings()
    const webhookUrl = settings.clayWebhook

    if (!webhookUrl || !webhookUrl.trim()) {
      return { success: false, message: 'No Clay webhook URL configured. Set it in Settings.' }
    }

    setIsPushing(true)
    try {
      // Check if using proxy (URL ends with /push or contains 'proxy')
      const isProxy = webhookUrl.includes('/push') || webhookUrl.includes('proxy')

      if (isProxy) {
        // Using proxy service - use batch endpoint
        const batchUrl = webhookUrl.replace(/\/push\/?$/, '/push/batch')

        const response = await fetch(batchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leads: leads.map(formatLeadPayload)
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
      } else {
        // Direct to Clay - push one by one (might fail due to CORS)
        let successCount = 0
        let failCount = 0

        for (const lead of leads) {
          try {
            const response = await fetch(webhookUrl.trim(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formatLeadPayload(lead)),
            })

            if (response.ok) {
              successCount++
            } else {
              failCount++
            }
          } catch {
            failCount++
          }
        }

        if (failCount === 0) {
          return { success: true, message: `Pushed ${successCount} leads to Clay` }
        } else if (successCount === 0) {
          return { success: false, message: `Failed to push ${failCount} leads` }
        } else {
          return { success: true, message: `Pushed ${successCount} leads, ${failCount} failed` }
        }
      }
    } catch (error) {
      console.error('Push to Clay error:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error'

      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return {
          success: false,
          message: 'CORS error: Use the clay-proxy service URL instead of Clay directly'
        }
      }

      return { success: false, message: `Failed to push: ${msg}` }
    } finally {
      setIsPushing(false)
    }
  }, [])

  return { pushLead, pushMultipleLeads, isPushing }
}

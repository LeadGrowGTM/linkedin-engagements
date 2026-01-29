import { useState, useCallback } from 'react'

interface LeadData {
  profile_url: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  headline?: string | null
  about?: string | null
  company_name?: string | null
  company_linkedin_url?: string | null
  company_website?: string | null
  company_industry?: string | null
  company_size?: string | null
  location?: string | null
  connections?: number | null
  followers?: number | null
  skills?: unknown
  experiences?: unknown
  experience?: unknown // DB has both columns
  educations?: unknown
  updates?: unknown
  licenseAndCertificates?: unknown
  honorsAndAwards?: unknown
  languages?: unknown
  volunteerAndAwards?: unknown
  organizations?: unknown
  totalTenureMonths?: string | null
  totalTenureDays?: string | null
  urn?: string | null
  public_identifier?: string | null
  parent_profile?: string | null
  created_at?: string | null
  last_enriched_at?: string | null
  raw_data?: unknown
}

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

function formatLeadPayload(lead: LeadData) {
  // Extract email from raw_data if available
  const rawData = lead.raw_data as Record<string, unknown> | null
  const email = rawData?.email || rawData?.emailAddress || null

  return {
    // Identifiers
    linkedin_url: lead.profile_url,
    urn: lead.urn,
    public_identifier: lead.public_identifier,

    // Basic info
    full_name: lead.full_name,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email,
    headline: lead.headline,
    about: lead.about,
    location: lead.location,
    connections: lead.connections,
    followers: lead.followers,

    // Company
    company_name: lead.company_name,
    company_linkedin_url: lead.company_linkedin_url,
    company_website: lead.company_website,
    company_industry: lead.company_industry,
    company_size: lead.company_size,

    // Career data
    skills: lead.skills,
    experiences: lead.experiences || lead.experience,
    educations: lead.educations,
    licenseAndCertificates: lead.licenseAndCertificates,
    honorsAndAwards: lead.honorsAndAwards,
    languages: lead.languages,
    volunteerAndAwards: lead.volunteerAndAwards,
    organizations: lead.organizations,
    updates: lead.updates,

    // Tenure
    totalTenureMonths: lead.totalTenureMonths,
    totalTenureDays: lead.totalTenureDays,

    // Metadata
    parent_profile: lead.parent_profile,
    created_at: lead.created_at,
    last_enriched_at: lead.last_enriched_at,
    raw_data: lead.raw_data,
    pushed_at: new Date().toISOString(),
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

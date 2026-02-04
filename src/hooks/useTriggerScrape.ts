import { useState, useCallback } from 'react'

interface TriggerResult {
  success: boolean
  message: string
}

function getSettings() {
  try {
    const saved = localStorage.getItem('app-settings')
    const parsed = saved ? JSON.parse(saved) : {}
    return {
      scrapePostsWebhook: parsed.scrapePostsWebhook || 'https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-posts',
      scrapeEngagersWebhook: parsed.scrapeEngagersWebhook || 'https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-engagers',
    }
  } catch {
    return {
      scrapePostsWebhook: 'https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-posts',
      scrapeEngagersWebhook: 'https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-engagers',
    }
  }
}

async function triggerWebhook(url: string): Promise<TriggerResult> {
  if (!url || !url.trim()) {
    return { success: false, message: 'No webhook URL configured. Set it in Settings.' }
  }

  try {
    const response = await fetch(url.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: 'manual', timestamp: new Date().toISOString() }),
    })

    if (!response.ok) {
      return { success: false, message: `Webhook returned ${response.status}` }
    }

    return { success: true, message: 'Workflow triggered successfully' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: `Failed to reach webhook: ${msg}` }
  }
}

export function useTriggerScrapeProfiles() {
  const [isTriggering, setIsTriggering] = useState(false)
  const [result, setResult] = useState<TriggerResult | null>(null)

  const trigger = useCallback(async () => {
    setIsTriggering(true)
    setResult(null)
    try {
      const settings = getSettings()
      const res = await triggerWebhook(settings.scrapePostsWebhook || '')
      setResult(res)
      return res
    } finally {
      setIsTriggering(false)
    }
  }, [])

  const clearResult = useCallback(() => setResult(null), [])

  return { trigger, isTriggering, result, clearResult }
}

export function useTriggerScrapeEngagers() {
  const [isTriggering, setIsTriggering] = useState(false)
  const [result, setResult] = useState<TriggerResult | null>(null)

  const trigger = useCallback(async () => {
    setIsTriggering(true)
    setResult(null)
    try {
      const settings = getSettings()
      const res = await triggerWebhook(settings.scrapeEngagersWebhook || '')
      setResult(res)
      return res
    } finally {
      setIsTriggering(false)
    }
  }, [])

  const clearResult = useCallback(() => setResult(null), [])

  return { trigger, isTriggering, result, clearResult }
}

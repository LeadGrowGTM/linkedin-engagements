import { useState, useEffect } from 'react'
import { Moon, Sun, Bell, Database, Tags, Webhook, Send } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'

interface SettingsState {
  defaultWebhook: string
  scrapePostsWebhook: string
  scrapeEngagersWebhook: string
  clayProxyUrl: string
  clayWebhookUrl: string
  autoEnable: boolean
  refreshInterval: number
  dataRetentionDays: number
  smartTagsEnabled: boolean
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('app-settings')
    const parsed = saved ? JSON.parse(saved) : {}
    return {
      defaultWebhook: parsed.defaultWebhook || '',
      scrapePostsWebhook: parsed.scrapePostsWebhook || 'https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-posts',
      scrapeEngagersWebhook: parsed.scrapeEngagersWebhook || 'https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-engagers',
      clayProxyUrl: parsed.clayProxyUrl || '',
      clayWebhookUrl: parsed.clayWebhookUrl || parsed.clayWebhook || '', // Migrate old clayWebhook
      autoEnable: parsed.autoEnable ?? true,
      refreshInterval: parsed.refreshInterval || 30,
      dataRetentionDays: parsed.dataRetentionDays || 90,
      smartTagsEnabled: parsed.smartTagsEnabled ?? true,
    }
  })

  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(settings))
  }, [settings])

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
          Configure your dashboard preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-navy-500 dark:text-navy-400">
                  Toggle dark mode theme
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Monitoring
            </CardTitle>
            <CardDescription>
              Configure monitoring and refresh settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-enable new profiles</Label>
                <p className="text-sm text-navy-500 dark:text-navy-400">
                  Automatically enable monitoring for new profiles
                </p>
              </div>
              <Switch
                checked={settings.autoEnable}
                onChange={(checked) =>
                  setSettings({ ...settings, autoEnable: checked })
                }
              />
            </div>
            <div>
              <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
              <Input
                id="refreshInterval"
                type="number"
                min="10"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    refreshInterval: parseInt(e.target.value) || 30,
                  })
                }
                className="mt-1"
              />
              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                How often to check for new data (10-300 seconds)
              </p>
            </div>
            <div>
              <Label htmlFor="defaultWebhook">Default Webhook URL</Label>
              <Input
                id="defaultWebhook"
                type="url"
                placeholder="https://your-n8n-instance.com/webhook/..."
                value={settings.defaultWebhook}
                onChange={(e) =>
                  setSettings({ ...settings, defaultWebhook: e.target.value })
                }
                className="mt-1"
              />
              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                Default webhook URL for new profiles
              </p>
            </div>
          </CardContent>
        </Card>

        {/* n8n Workflow Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              n8n Workflow Triggers
            </CardTitle>
            <CardDescription>
              Webhook URLs to manually trigger n8n scraping workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scrapePostsWebhook">Scrape Posts Webhook (Part 1)</Label>
              <Input
                id="scrapePostsWebhook"
                type="url"
                placeholder="https://your-n8n-instance.com/webhook/..."
                value={settings.scrapePostsWebhook}
                onChange={(e) =>
                  setSettings({ ...settings, scrapePostsWebhook: e.target.value })
                }
                className="mt-1"
              />
              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                Triggers Part 1: scrapes new posts from all enabled profiles
              </p>
            </div>
            <div>
              <Label htmlFor="scrapeEngagersWebhook">Scrape Engagers Webhook (Part 2)</Label>
              <Input
                id="scrapeEngagersWebhook"
                type="url"
                placeholder="https://your-n8n-instance.com/webhook/..."
                value={settings.scrapeEngagersWebhook}
                onChange={(e) =>
                  setSettings({ ...settings, scrapeEngagersWebhook: e.target.value })
                }
                className="mt-1"
              />
              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                Triggers Part 2: extracts engagers from pending posts
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Add a Webhook trigger node in your n8n workflows and paste the URL here. See docs for setup instructions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Clay Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Clay Integration
            </CardTitle>
            <CardDescription>
              Push leads to Clay for enrichment and outreach
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clayProxyUrl">Clay Proxy URL</Label>
              <Input
                id="clayProxyUrl"
                type="url"
                placeholder="https://your-clay-proxy.railway.app/push"
                value={settings.clayProxyUrl}
                onChange={(e) =>
                  setSettings({ ...settings, clayProxyUrl: e.target.value })
                }
                className="mt-1"
              />
              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                Your deployed clay-proxy service URL (ending with /push)
              </p>
            </div>
            <div>
              <Label htmlFor="clayWebhookUrl">Clay Webhook URL</Label>
              <Input
                id="clayWebhookUrl"
                type="url"
                placeholder="https://app.clay.com/api/v1/webhook/..."
                value={settings.clayWebhookUrl}
                onChange={(e) =>
                  setSettings({ ...settings, clayWebhookUrl: e.target.value })
                }
                className="mt-1"
              />
              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                Your Clay table's webhook URL (from Clay dashboard)
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                Setup Instructions:
              </p>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Deploy the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">clay-proxy</code> folder to Railway</li>
                <li>Copy the deployed URL and paste above as Proxy URL</li>
                <li>Get your Clay webhook URL from Clay and paste above</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Smart Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Smart Tags
            </CardTitle>
            <CardDescription>
              Configure automatic tag generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Smart Tags</Label>
                <p className="text-sm text-navy-500 dark:text-navy-400">
                  Automatically generate tags based on engager data
                </p>
              </div>
              <Switch
                checked={settings.smartTagsEnabled}
                onChange={(checked) =>
                  setSettings({ ...settings, smartTagsEnabled: checked })
                }
              />
            </div>
            <div className="rounded-lg bg-navy-50 dark:bg-navy-950 p-4">
              <p className="text-sm text-navy-600 dark:text-navy-400">
                Smart tags are generated from:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-navy-500 dark:text-navy-500">
                <li>• Company industries</li>
                <li>• Geographic locations</li>
                <li>• Job titles and roles</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Manage your data retention and storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dataRetention">Data Retention (days)</Label>
              <Input
                id="dataRetention"
                type="number"
                min="7"
                max="365"
                value={settings.dataRetentionDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    dataRetentionDays: parseInt(e.target.value) || 90,
                  })
                }
                className="mt-1"
              />
              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                How long to keep historical data (7-365 days)
              </p>
            </div>
            <div className="rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950 p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Data retention is configured in your n8n workflows. This setting is for reference only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          {isSaved ? '✓ Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}


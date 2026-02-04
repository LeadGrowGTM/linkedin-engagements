import { useState, useMemo, useEffect } from 'react'
import { Plus, Settings2, Folder, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import AddProfileModal from '@/components/profiles/AddProfileModal'
import ManageCategoriesModal from '@/components/profiles/ManageCategoriesModal'
import ProfileCard from '@/components/profiles/ProfileCard'
import { useProfileStats } from '@/hooks/useProfiles'
import { useCategories } from '@/hooks/useCategories'
import { useTriggerScrapeProfiles } from '@/hooks/useTriggerScrape'

export default function Profiles() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: profiles, isLoading } = useProfileStats()
  const { data: categories } = useCategories()
  const { trigger: triggerScrape, isTriggering, result: scrapeResult, clearResult } = useTriggerScrapeProfiles()

  useEffect(() => {
    if (scrapeResult) {
      const timer = setTimeout(clearResult, 4000)
      return () => clearTimeout(timer)
    }
  }, [scrapeResult, clearResult])

  // Filter profiles by search query
  const filteredProfiles = useMemo(() => {
    if (!profiles) return []
    if (!searchQuery) return profiles

    const query = searchQuery.toLowerCase()
    return profiles.filter(profile => {
      const username = profile.profile_url.toLowerCase()
      const description = (profile.description || '').toLowerCase()
      const category = (profile.category || '').toLowerCase()
      return username.includes(query) || description.includes(query) || category.includes(query)
    })
  }, [profiles, searchQuery])

  // Group profiles by category
  const groupedProfiles = useMemo(() => {
    if (!filteredProfiles.length) return {}

    const groups: Record<string, typeof filteredProfiles> = {}

    filteredProfiles.forEach(profile => {
      const categoryName = profile.category || 'Uncategorized'
      if (!groups[categoryName]) {
        groups[categoryName] = []
      }
      groups[categoryName].push(profile)
    })

    return groups
  }, [filteredProfiles])

  // Get category color
  const getCategoryColor = (categoryName: string) => {
    if (categoryName === 'Uncategorized') return '#6b7280' // gray
    const category = categories?.find(c => c.name === categoryName)
    return category?.color || '#3b82f6'
  }

  // Sort category names: real categories first (alphabetically), then Uncategorized
  const sortedCategoryNames = useMemo(() => {
    const names = Object.keys(groupedProfiles)
    return names.sort((a, b) => {
      if (a === 'Uncategorized') return 1
      if (b === 'Uncategorized') return -1
      return a.localeCompare(b)
    })
  }, [groupedProfiles])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
            Profile Management
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Manage LinkedIn profiles organized by category
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scrapeResult && (
            <span className={`text-sm ${scrapeResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {scrapeResult.message}
            </span>
          )}
          <Button variant="outline" onClick={triggerScrape} disabled={isTriggering}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isTriggering ? 'animate-spin' : ''}`} />
            {isTriggering ? 'Scraping...' : 'Scrape New Posts'}
          </Button>
          <Button variant="outline" onClick={() => setIsManageCategoriesOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Profile
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
        <Input
          type="text"
          placeholder="Search profiles by username, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Profiles by Category */}
      {isLoading ? (
        <div className="space-y-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-8 w-48 bg-navy-200 dark:bg-navy-800 rounded animate-pulse" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, j) => (
                  <Card key={j} className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-12 w-12 bg-navy-200 dark:bg-navy-800 rounded-full" />
                      <div className="h-4 bg-navy-200 dark:bg-navy-800 rounded w-3/4" />
                      <div className="h-4 bg-navy-200 dark:bg-navy-800 rounded w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : profiles && profiles.length > 0 ? (
        <div className="space-y-8">
          {sortedCategoryNames.map((categoryName) => {
            const categoryProfiles = groupedProfiles[categoryName]
            const categoryColor = getCategoryColor(categoryName)
            
            return (
              <div key={categoryName} className="space-y-4">
                {/* Category Header */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-1 h-8 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Folder 
                      className="h-5 w-5"
                      style={{ color: categoryColor }}
                    />
                    <h2 
                      className="text-xl font-semibold"
                      style={{ color: categoryColor }}
                    >
                      {categoryName}
                    </h2>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: categoryColor + '20',
                        color: categoryColor,
                        borderColor: categoryColor + '40',
                      }}
                    >
                      {categoryProfiles.length} {categoryProfiles.length === 1 ? 'profile' : 'profiles'}
                    </Badge>
                  </div>
                </div>

                {/* Vertical Stacked Profile Cards */}
                <div className="space-y-3">
                  {categoryProfiles.map((profile) => (
                    <ProfileCard 
                      key={profile.id} 
                      profile={profile}
                      categoryColor={categoryColor}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Folder className="h-12 w-12 text-navy-400 dark:text-navy-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 dark:text-navy-50">
              No profiles yet
            </h3>
            <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
              Get started by adding your first LinkedIn profile to monitor.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Profile
            </Button>
          </div>
        </Card>
      )}

      {/* Modals */}
      <AddProfileModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <ManageCategoriesModal open={isManageCategoriesOpen} onClose={() => setIsManageCategoriesOpen(false)} />
    </div>
  )
}

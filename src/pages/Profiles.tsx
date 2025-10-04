import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AddProfileModal from '@/components/profiles/AddProfileModal'
import ProfileCard from '@/components/profiles/ProfileCard'
import { useProfileStats } from '@/hooks/useProfiles'
import { Card } from '@/components/ui/card'

export default function Profiles() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: profiles, isLoading } = useProfileStats()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
            Profile Management
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Manage LinkedIn profiles to monitor for engagement
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Profile
        </Button>
      </div>

      {/* Profiles Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-12 w-12 bg-navy-200 dark:bg-navy-800 rounded-full" />
                <div className="h-4 bg-navy-200 dark:bg-navy-800 rounded w-3/4" />
                <div className="h-4 bg-navy-200 dark:bg-navy-800 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : profiles && profiles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-navy-50">
              No profiles yet
            </h3>
            <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
              Get started by adding your first LinkedIn profile to monitor.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Profile
            </Button>
          </div>
        </Card>
      )}

      {/* Add Profile Modal */}
      <AddProfileModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}


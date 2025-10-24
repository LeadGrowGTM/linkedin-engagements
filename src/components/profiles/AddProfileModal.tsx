import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAddProfile } from '@/hooks/useProfiles'
import { useCategories } from '@/hooks/useCategories'

interface AddProfileModalProps {
  open: boolean
  onClose: () => void
}

export default function AddProfileModal({ open, onClose }: AddProfileModalProps) {
  const [profileUrl, setProfileUrl] = useState('')
  const [webhook, setWebhook] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const addProfile = useAddProfile()
  const { data: categories } = useCategories()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profileUrl.trim()) return

    try {
      await addProfile.mutateAsync({
        profile_url: profileUrl.trim(),
        Webhook: webhook.trim() || null,
        webhooks: webhook.trim() ? [webhook.trim()] : null,
        description: description.trim() || null,
        category: category.trim() || null,
        is_enabled: true,
      })
      
      // Reset form and close
      setProfileUrl('')
      setWebhook('')
      setDescription('')
      setCategory('')
      onClose()
    } catch (error) {
      console.error('Error adding profile:', error)
    }
  }

  const handleClose = () => {
    if (!addProfile.isPending) {
      setProfileUrl('')
      setWebhook('')
      setDescription('')
      setCategory('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Add LinkedIn Profile</DialogTitle>
          <DialogDescription>
            Add a new LinkedIn profile to monitor for engagement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="profileUrl">Profile URL *</Label>
            <Input
              id="profileUrl"
              type="url"
              placeholder="https://www.linkedin.com/in/username"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Profile Description (optional)</Label>
            <textarea
              id="description"
              placeholder="Describe what types of posts this profile makes, potential crossover opportunities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-navy-300 dark:border-navy-700 rounded-md bg-white dark:bg-navy-950 text-navy-900 dark:text-navy-50 placeholder:text-navy-400 dark:placeholder:text-navy-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 min-h-[80px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="category">Category / Folder (optional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => alert('Click "Manage Categories" button on Profiles page to create categories')}
              >
                <Settings2 className="h-3 w-3 mr-1" />
                Manage
              </Button>
            </div>
            {categories && categories.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge
                  variant={category === '' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCategory('')}
                >
                  None
                </Badge>
                {categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={category === cat.name ? 'default' : 'outline'}
                    className="cursor-pointer"
                    style={
                      category === cat.name
                        ? {
                            backgroundColor: cat.color,
                            borderColor: cat.color,
                          }
                        : {
                            borderColor: cat.color + '60',
                            color: cat.color,
                          }
                    }
                    onClick={() => setCategory(cat.name)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                No categories available. Create one using "Manage Categories" on the Profiles page.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="webhook">Webhook URL (optional)</Label>
            <Input
              id="webhook"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/..."
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
              You can add more webhooks later by editing the profile
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={addProfile.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={addProfile.isPending}>
            {addProfile.isPending ? 'Adding...' : 'Add Profile'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}


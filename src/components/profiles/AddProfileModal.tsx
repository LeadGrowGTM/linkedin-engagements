import { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddProfile } from '@/hooks/useProfiles'

interface AddProfileModalProps {
  open: boolean
  onClose: () => void
}

export default function AddProfileModal({ open, onClose }: AddProfileModalProps) {
  const [profileUrl, setProfileUrl] = useState('')
  const [webhook, setWebhook] = useState('')
  const addProfile = useAddProfile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profileUrl.trim()) return

    try {
      await addProfile.mutateAsync({
        profile_url: profileUrl.trim(),
        Webhook: webhook.trim() || null,
        is_enabled: true,
      })
      
      // Reset form and close
      setProfileUrl('')
      setWebhook('')
      onClose()
    } catch (error) {
      console.error('Error adding profile:', error)
    }
  }

  const handleClose = () => {
    if (!addProfile.isPending) {
      setProfileUrl('')
      setWebhook('')
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
            <Label htmlFor="webhook">Webhook URL (optional)</Label>
            <Input
              id="webhook"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/..."
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
              className="mt-1"
            />
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


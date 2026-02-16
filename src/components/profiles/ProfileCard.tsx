import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Trash2, Calendar, FileText, BarChart3, Edit2, Save, X, Plus, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatNumber, parseLinkedInUsername } from '@/lib/utils'
import { useUpdateProfile, useDeleteProfile } from '@/hooks/useProfiles'
import { useCategories } from '@/hooks/useCategories'
import { usePushToWebhook } from '@/hooks/usePushToWebhook'
import { useToast } from '@/components/ui/toast'

interface ProfileCardProps {
  profile: {
    id: number
    profile_url: string
    is_enabled: boolean | null
    created_at: string | null
    Webhook: string | null
    webhooks: any
    description: string | null
    category: string | null
    postCount: number
    engagerCount: number
  }
  categoryColor?: string
}

export default function ProfileCard({ profile, categoryColor }: ProfileCardProps) {
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const deleteProfile = useDeleteProfile()
  const { data: categories } = useCategories()
  const { pushProfileEngagers, isPushing: isPushingWebhook } = usePushToWebhook()
  const { showToast } = useToast()
  const username = parseLinkedInUsername(profile.profile_url)

  const webhookUrls: string[] = (() => {
    if (profile.webhooks && Array.isArray(profile.webhooks)) return profile.webhooks
    if (profile.Webhook) return [profile.Webhook]
    return []
  })()
  const hasWebhooks = webhookUrls.filter(u => u && u.trim()).length > 0

  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState(profile.description || '')
  const [editedCategory, setEditedCategory] = useState(profile.category || '')
  const [editedWebhooks, setEditedWebhooks] = useState<string[]>(() => {
    if (profile.webhooks && Array.isArray(profile.webhooks)) {
      return profile.webhooks
    } else if (profile.Webhook) {
      return [profile.Webhook]
    }
    return []
  })

  const handleToggleEnabled = async () => {
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        is_enabled: !profile.is_enabled,
      })
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm(`Delete ${username}? This action cannot be undone.`)) {
      try {
        await deleteProfile.mutateAsync(profile.id)
      } catch (error) {
        console.error('Error deleting profile:', error)
      }
    }
  }

  const handlePushToWebhook = async () => {
    if (!hasWebhooks) {
      showToast('No webhook URLs configured. Edit the profile to add one.', 'error')
      return
    }
    if (profile.engagerCount === 0) {
      showToast('No engagers to push for this profile.', 'info')
      return
    }

    const confirmed = confirm(
      `Push ${profile.engagerCount} engager${profile.engagerCount !== 1 ? 's' : ''} to ${webhookUrls.length} webhook${webhookUrls.length !== 1 ? 's' : ''}?`
    )
    if (!confirmed) return

    const result = await pushProfileEngagers(profile.profile_url, webhookUrls)
    showToast(result.message, result.success ? 'success' : 'error')
  }

  const handleSaveEdits = async () => {
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        description: editedDescription || null,
        category: editedCategory || null,
        webhooks: editedWebhooks.length > 0 ? editedWebhooks : null,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditedDescription(profile.description || '')
    setEditedCategory(profile.category || '')
    setEditedWebhooks(() => {
      if (profile.webhooks && Array.isArray(profile.webhooks)) {
        return profile.webhooks
      } else if (profile.Webhook) {
        return [profile.Webhook]
      }
      return []
    })
    setIsEditing(false)
  }

  const handleAddWebhook = () => {
    setEditedWebhooks([...editedWebhooks, ''])
  }

  const handleRemoveWebhook = (index: number) => {
    setEditedWebhooks(editedWebhooks.filter((_, i) => i !== index))
  }

  if (isEditing) {
    return (
      <Card 
        className="transition-all border-l-4"
        style={{ borderLeftColor: categoryColor || '#3b82f6' }}
      >
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with Save/Cancel */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900 dark:text-navy-50">
                    Editing: {username}
                  </h3>
                  <a
                    href={profile.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View LinkedIn
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdits} disabled={updateProfile.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Profile Description</Label>
              <textarea
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Describe what types of posts this profile makes..."
                className="mt-1 w-full px-3 py-2 text-sm border border-navy-300 dark:border-navy-700 rounded-md bg-white dark:bg-navy-950 text-navy-900 dark:text-navy-50 placeholder:text-navy-400 dark:placeholder:text-navy-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 min-h-[80px]"
              />
            </div>

            {/* Category Input */}
            <div>
              <Label htmlFor="category">Category / Folder</Label>
              {categories && categories.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    variant={editedCategory === '' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setEditedCategory('')}
                  >
                    None
                  </Badge>
                  {categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={editedCategory === cat.name ? 'default' : 'outline'}
                      className="cursor-pointer"
                      style={
                        editedCategory === cat.name
                          ? {
                              backgroundColor: cat.color,
                              borderColor: cat.color,
                            }
                          : {
                              borderColor: cat.color + '60',
                              color: cat.color,
                            }
                      }
                      onClick={() => setEditedCategory(cat.name)}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-navy-500 dark:text-navy-400">
                  No categories available. Create one first.
                </p>
              )}
            </div>

            {/* Webhooks */}
            <div>
              <Label>Webhook URLs</Label>
              <div className="mt-2 space-y-2">
                {editedWebhooks.map((webhook, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={webhook}
                      onChange={(e) => {
                        const newWebhooks = [...editedWebhooks]
                        newWebhooks[index] = e.target.value
                        setEditedWebhooks(newWebhooks)
                      }}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleRemoveWebhook(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddWebhook}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook URL
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className="transition-all hover:shadow-md border-l-4"
      style={{ borderLeftColor: categoryColor || '#3b82f6' }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-lg">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-navy-900 dark:text-navy-50 truncate">
                {username}
              </h3>
              <a
                href={profile.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            {profile.description && (
              <p className="text-sm text-navy-600 dark:text-navy-400 line-clamp-1">
                {profile.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Posts</div>
              <div className="text-lg font-semibold text-navy-900 dark:text-navy-50">
                {formatNumber(profile.postCount)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">Engagers</div>
              <div className="text-lg font-semibold text-navy-900 dark:text-navy-50">
                {formatNumber(profile.engagerCount)}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {profile.is_enabled ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={profile.is_enabled || false}
              onChange={handleToggleEnabled}
              disabled={updateProfile.isPending}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate(`/profiles/${encodeURIComponent(profile.profile_url)}/posts`)}
              title="View Post Performance"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            {hasWebhooks && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePushToWebhook}
                disabled={isPushingWebhook || profile.engagerCount === 0}
                title={`Push ${profile.engagerCount} engagers to webhook`}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                <Send className={`h-4 w-4 ${isPushingWebhook ? 'animate-pulse' : ''}`} />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              title="Edit Profile"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteProfile.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              title="Delete Profile"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Webhooks (if any) */}
        {((profile.webhooks && Array.isArray(profile.webhooks) && profile.webhooks.length > 0) || profile.Webhook) && (
          <div className="mt-3 pt-3 border-t border-navy-200 dark:border-navy-800">
            <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
              <FileText className="h-3 w-3" />
              <span className="font-medium">Webhooks:</span>
              <div className="flex gap-1 flex-wrap">
                {(profile.webhooks && Array.isArray(profile.webhooks) ? profile.webhooks : [profile.Webhook]).map((webhook, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {webhook?.slice(0, 40)}...
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Date Added */}
        {profile.created_at && (
          <div className="mt-2 flex items-center gap-1 text-xs text-navy-500 dark:text-navy-400">
            <Calendar className="h-3 w-3" />
            Added: {formatDate(profile.created_at)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

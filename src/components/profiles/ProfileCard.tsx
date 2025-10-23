import { useNavigate } from 'react-router-dom'
import { ExternalLink, Trash2, Calendar, FileText, UserPlus, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatNumber, parseLinkedInUsername } from '@/lib/utils'
import { useUpdateProfile, useDeleteProfile } from '@/hooks/useProfiles'

interface ProfileCardProps {
  profile: {
    id: number
    profile_url: string
    is_enabled: boolean | null
    created_at: string | null
    Webhook: string | null
    postCount: number
    engagerCount: number
  }
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const deleteProfile = useDeleteProfile()
  const username = parseLinkedInUsername(profile.profile_url)

  const handleToggle = () => {
    updateProfile.mutate({
      id: profile.id,
      is_enabled: !profile.is_enabled,
    })
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      deleteProfile.mutate(profile.id)
    }
  }

  const handleViewPosts = () => {
    const encodedUrl = encodeURIComponent(profile.profile_url)
    navigate(`/profiles/${encodedUrl}/posts`)
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        {/* Header Section - Profile Info and Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-lg">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-navy-900 dark:text-navy-50 truncate">
                  {username}
                </h3>
                {profile.is_enabled ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <a
                href={profile.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View Profile
              </a>
            </div>
          </div>

          {/* Actions - Switch and Delete */}
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <Switch
              checked={profile.is_enabled ?? true}
              onChange={handleToggle}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-navy-500 dark:text-navy-400">
              <FileText className="h-3 w-3" />
              Posts Tracked
            </div>
            <p className="mt-1 text-lg font-semibold text-navy-900 dark:text-navy-50">
              {formatNumber(profile.postCount)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-navy-500 dark:text-navy-400">
              <UserPlus className="h-3 w-3" />
              Engagers
            </div>
            <p className="mt-1 text-lg font-semibold text-navy-900 dark:text-navy-50">
              {formatNumber(profile.engagerCount)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-navy-500 dark:text-navy-400">
              <Calendar className="h-3 w-3" />
              Added
            </div>
            <p className="mt-1 text-sm font-medium text-navy-900 dark:text-navy-50">
              {profile.created_at ? formatDate(profile.created_at) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Webhook Section - Only show if webhook exists */}
        {profile.Webhook && (
          <div className="mb-4 p-3 rounded-lg bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800">
            <p className="text-xs font-medium text-navy-500 dark:text-navy-400 mb-1">
              Webhook URL
            </p>
            <p className="text-xs font-mono text-navy-900 dark:text-navy-50 break-all">
              {profile.Webhook}
            </p>
          </div>
        )}

        {/* View Performance Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewPosts}
          className="w-full gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          View Post Performance
        </Button>
      </CardContent>
    </Card>
  )
}


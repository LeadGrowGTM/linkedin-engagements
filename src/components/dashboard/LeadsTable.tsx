import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Engager {
  id: string
  profileUrl: string
  fullName: string
  headline: string
  companyName: string
  companyIndustry?: string | null
  companySize?: string | null
  location?: string | null
  connections?: number | null
  followers?: number | null
  parentProfile: string | null
  parentProfileUsername: string
  smartTags: string[]
  engagementCount: number
  createdAt: string | null
}

interface EngagersTableProps {
  engagers: Engager[]
  isLoading?: boolean
}

export default function EngagersTable({ engagers, isLoading }: EngagersTableProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-navy-100 dark:bg-navy-800 rounded" />
          ))}
        </div>
      </Card>
    )
  }

  if (engagers.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <p className="text-navy-500 dark:text-navy-400">
            No engagers found for the selected time period.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-200 dark:border-navy-800">
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                Full Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                Headline
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                Company
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                Smart Tags
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-navy-500 dark:text-navy-400">
                Engaged With
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-200 dark:divide-navy-800">
            {engagers.map((engager) => (
              <tr
                key={engager.id}
                className="transition-colors hover:bg-navy-50 dark:hover:bg-navy-900"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {engager.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/engagers/${encodeURIComponent(engager.profileUrl)}`}
                          className="text-sm font-medium text-navy-900 dark:text-navy-50 hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                        >
                          {engager.fullName}
                        </Link>
                        {engager.engagementCount > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {engager.engagementCount}x
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-navy-900 dark:text-navy-50 max-w-xs truncate">
                    {engager.headline}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-navy-900 dark:text-navy-50">
                    {engager.companyName}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {engager.smartTags.length > 0 ? (
                      engager.smartTags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-navy-400 dark:text-navy-500">
                        No tags
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {engager.parentProfile ? (
                    <a
                      href={engager.parentProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {engager.parentProfileUsername}
                    </a>
                  ) : (
                    <span className="text-sm text-navy-400 dark:text-navy-500">
                      N/A
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}


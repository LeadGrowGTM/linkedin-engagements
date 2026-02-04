import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </Card>
    )
  }

  if (engagers.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <p className="text-muted-foreground">
            No engagers found for the selected time period.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Full Name</TableHead>
              <TableHead className="min-w-[200px]">Headline</TableHead>
              <TableHead className="w-[180px]">Company</TableHead>
              <TableHead className="w-[200px]">Smart Tags</TableHead>
              <TableHead className="w-[150px]">Engaged With</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {engagers.map((engager) => (
              <TableRow key={engager.id} className="hover:bg-muted/50">
                <TableCell className="w-[280px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {engager.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/engagers/${encodeURIComponent(engager.profileUrl)}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
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
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {engager.headline}
                  </div>
                </TableCell>
                <TableCell className="w-[180px]">
                  <div className="text-sm font-medium text-foreground">
                    {engager.companyName}
                  </div>
                </TableCell>
                <TableCell className="w-[200px]">
                  <div className="flex flex-wrap gap-1">
                    {engager.smartTags.length > 0 ? (
                      engager.smartTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No tags
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="w-[150px]">
                  {engager.parentProfile ? (
                    <a
                      href={engager.parentProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {engager.parentProfileUsername}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      N/A
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}


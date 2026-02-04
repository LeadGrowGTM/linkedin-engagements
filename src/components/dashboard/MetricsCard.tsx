import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatNumber } from '@/lib/utils'

interface MetricsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  format?: 'number' | 'percentage' | 'text'
  isLoading?: boolean
}

export default function MetricsCard({
  title,
  value,
  icon: Icon,
  trend,
  format = 'number',
  isLoading,
}: MetricsCardProps) {
  const formattedValue = isLoading
    ? '...'
    : format === 'number'
    ? formatNumber(Number(value))
    : format === 'percentage'
    ? `${(Number(value) * 100).toFixed(1)}%`
    : value

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-navy-900 dark:text-navy-50">
              {formattedValue}
            </p>
            {trend && (
              <p
                className={cn(
                  'mt-2 text-sm font-medium',
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}% from last period
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950">
            <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


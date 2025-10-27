import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

// Wrapper around recharts
const Chart = React.forwardRef<
  React.ElementRef<typeof RechartsPrimitive.ResponsiveContainer>,
  React.ComponentPropsWithoutRef<typeof RechartsPrimitive.ResponsiveContainer>
>(({ className, ...props }, ref) => {
  return (
    <RechartsPrimitive.ResponsiveContainer
      className={cn("h-[240px]", className)}
      ref={ref}
      {...props}
    />
  )
})
Chart.displayName = "Chart"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: Record<string, {
      label: string
      color: string
      theme?: {
        light: string
        dark: string
      }
    }>
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
  }
>(({ className, config, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      {...props}
    >
      <Chart className="w-full">
        {children}
      </Chart>
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsPrimitive.Tooltip
const ChartTooltipContent = RechartsPrimitive.Tooltip
const ChartLegend = RechartsPrimitive.Legend
const ChartLegendContent = RechartsPrimitive.Legend

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}

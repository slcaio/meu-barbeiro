import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
  }
}

export function KpiCard({ title, value, icon: Icon, iconColor = 'text-primary', trend }: KpiCardProps) {
  const isPositive = trend && trend.value >= 0
  
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                  isPositive 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10", iconColor.replace('text-', 'bg-').replace('600', '500/10').replace('500', '500/10'))}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

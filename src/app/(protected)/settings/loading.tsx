import { Card, CardContent } from '@/components/ui/card'

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-52 animate-pulse bg-muted rounded" />
        <div className="h-5 w-64 mt-2 animate-pulse bg-muted rounded" />
      </div>

      {/* Settings Cards Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 animate-pulse bg-muted rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-32 animate-pulse bg-muted rounded" />
                  <div className="h-4 w-48 animate-pulse bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

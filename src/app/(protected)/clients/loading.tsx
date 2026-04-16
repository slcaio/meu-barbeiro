import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-40 animate-pulse bg-muted rounded" />
          <div className="h-5 w-56 mt-2 animate-pulse bg-muted rounded" />
        </div>
        <div className="h-9 w-36 animate-pulse bg-muted rounded" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-28 animate-pulse bg-muted rounded" />
              <div className="h-10 w-10 animate-pulse bg-muted rounded-xl" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client List Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse bg-muted rounded-full" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                    <div className="h-3 w-40 animate-pulse bg-muted rounded" />
                  </div>
                </div>
                <div className="h-8 w-8 animate-pulse bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

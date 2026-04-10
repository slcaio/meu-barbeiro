import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="h-5 w-72 mt-2 animate-pulse bg-muted rounded" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse bg-muted rounded" />
                  <div className="h-8 w-32 animate-pulse bg-muted rounded" />
                </div>
                <div className="h-12 w-12 animate-pulse bg-muted rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-40 animate-pulse bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section Skeleton */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="h-5 w-48 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                    <div className="h-3 w-48 animate-pulse bg-muted rounded" />
                  </div>
                  <div className="h-6 w-20 animate-pulse bg-muted rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="h-5 w-32 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

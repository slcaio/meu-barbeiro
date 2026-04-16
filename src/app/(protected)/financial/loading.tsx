import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function FinancialLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-44 animate-pulse bg-muted rounded" />
          <div className="h-5 w-64 mt-2 animate-pulse bg-muted rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 animate-pulse bg-muted rounded" />
          <div className="h-9 w-32 animate-pulse bg-muted rounded" />
          <div className="h-9 w-40 animate-pulse bg-muted rounded" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="h-10 w-full animate-pulse bg-muted rounded" />

      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-28 animate-pulse bg-muted rounded" />
              <div className="h-10 w-10 animate-pulse bg-muted rounded-xl" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="h-5 w-32 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] animate-pulse bg-muted rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-5 w-28 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] animate-pulse bg-muted rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-5 w-28 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] animate-pulse bg-muted rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Transaction List Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-5 w-40 animate-pulse bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="space-y-1.5">
                  <div className="h-4 w-40 animate-pulse bg-muted rounded" />
                  <div className="h-3 w-24 animate-pulse bg-muted rounded" />
                </div>
                <div className="h-6 w-24 animate-pulse bg-muted rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

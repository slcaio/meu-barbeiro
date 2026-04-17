import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ServicesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-36 animate-pulse bg-muted rounded" />
        <div className="h-5 w-72 mt-2 animate-pulse bg-muted rounded" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Form Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-5 w-44 animate-pulse bg-muted rounded" />
            <div className="h-4 w-64 mt-1 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse bg-muted rounded" />
              <div className="h-9 w-full animate-pulse bg-muted rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse bg-muted rounded" />
              <div className="h-9 w-full animate-pulse bg-muted rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse bg-muted rounded" />
                <div className="h-9 w-full animate-pulse bg-muted rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse bg-muted rounded" />
                <div className="h-9 w-full animate-pulse bg-muted rounded" />
              </div>
            </div>
            <div className="h-9 w-full animate-pulse bg-muted rounded" />
          </CardContent>
        </Card>

        {/* List Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-5 w-40 animate-pulse bg-muted rounded" />
            <div className="h-4 w-56 mt-1 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                    <div className="h-3 w-40 animate-pulse bg-muted rounded" />
                  </div>
                  <div className="h-8 w-8 animate-pulse bg-muted rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Card, CardContent } from '@/components/ui/card'

export default function AppointmentsLoading() {
  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-40 animate-pulse bg-muted rounded" />
          <div className="h-5 w-64 mt-2 animate-pulse bg-muted rounded" />
        </div>
      </div>

      {/* Calendar skeleton */}
      <Card>
        <CardContent className="p-4">
          {/* Toolbar skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <div className="h-9 w-24 animate-pulse bg-muted rounded" />
              <div className="h-9 w-24 animate-pulse bg-muted rounded" />
              <div className="h-9 w-24 animate-pulse bg-muted rounded" />
            </div>
            <div className="h-9 w-48 animate-pulse bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-9 w-9 animate-pulse bg-muted rounded" />
              <div className="h-9 w-9 animate-pulse bg-muted rounded" />
            </div>
          </div>
          {/* Calendar body skeleton */}
          <div className="h-[500px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

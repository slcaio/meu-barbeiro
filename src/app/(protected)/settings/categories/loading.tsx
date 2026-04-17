import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-40 animate-pulse bg-muted rounded" />
          <div className="h-5 w-72 mt-2 animate-pulse bg-muted rounded" />
        </div>
        <div className="h-9 w-36 animate-pulse bg-muted rounded" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-24 animate-pulse bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                    <div className="h-8 w-8 animate-pulse bg-muted rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

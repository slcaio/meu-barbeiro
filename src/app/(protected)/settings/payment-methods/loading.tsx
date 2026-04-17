import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function PaymentMethodsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-56 animate-pulse bg-muted rounded" />
        <div className="h-5 w-72 mt-2 animate-pulse bg-muted rounded" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="h-5 w-36 animate-pulse bg-muted rounded" />
          <div className="h-9 w-36 animate-pulse bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="space-y-1.5">
                  <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                  <div className="h-3 w-48 animate-pulse bg-muted rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 animate-pulse bg-muted rounded" />
                  <div className="h-8 w-8 animate-pulse bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

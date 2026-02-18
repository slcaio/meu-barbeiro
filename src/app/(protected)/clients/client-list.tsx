'use client'

import { Button } from '@/components/ui/button'
import { deleteClient } from '@/app/clients/actions'
import { Trash2, Phone, Mail, User } from 'lucide-react'
import { useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function ClientList({ clients }: { clients: any[] }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      startTransition(async () => {
        await deleteClient(id)
      })
    }
  }

  if (clients.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente encontrado.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <Card key={client.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-lg">{client.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1 mt-1">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleDelete(client.id)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

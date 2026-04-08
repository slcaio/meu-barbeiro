'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Trash2, Pencil } from 'lucide-react'
import { deleteBarber } from '@/app/barbers/actions'
import { formatPhone } from '@/lib/utils'
import { CreateBarberDialog } from './create-barber-dialog'
import { EditBarberDialog } from './edit-barber-dialog'

interface Barber {
  id: string
  barbershop_id: string
  name: string
  phone: string | null
  email: string | null
  role: string
  avatar_url: string | null
  commission_percentage: number
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

const roleLabels: Record<string, string> = {
  barber: 'Barbeiro',
  senior_barber: 'Sênior',
  trainee: 'Aprendiz',
}

const roleColors: Record<string, string> = {
  barber: 'bg-blue-100 text-blue-800',
  senior_barber: 'bg-purple-100 text-purple-800',
  trainee: 'bg-yellow-100 text-yellow-800',
}

export function BarberList({ barbers }: { barbers: Barber[] }) {
  const [search, setSearch] = useState('')
  const [editBarber, setEditBarber] = useState<Barber | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filteredBarbers = barbers.filter(barber =>
    barber.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (barberId: string) => {
    startTransition(async () => {
      const result = await deleteBarber(barberId)
      if (result.error) {
        alert(result.error)
      }
      setConfirmDeleteId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar barbeiro..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <CreateBarberDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Barbeiros ({filteredBarbers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBarbers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {barbers.length === 0
                ? 'Nenhum barbeiro cadastrado. Adicione seu primeiro barbeiro!'
                : 'Nenhum barbeiro encontrado com esse nome.'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredBarbers.map((barber) => (
                <div
                  key={barber.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                      {barber.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{barber.name}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[barber.role] || 'bg-gray-100 text-gray-800'}`}>
                          {roleLabels[barber.role] || barber.role}
                        </span>
                        {!barber.is_active && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {barber.phone && <span>{formatPhone(barber.phone)}</span>}
                        {barber.commission_percentage > 0 && (
                          <span>Comissão: {barber.commission_percentage}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {confirmDeleteId === barber.id ? (
                      <>
                        <span className="text-sm text-red-600">Confirmar exclusão?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(barber.id)}
                          disabled={isPending}
                        >
                          Sim
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isPending}
                        >
                          Não
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditBarber(barber)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmDeleteId(barber.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditBarberDialog
        barber={editBarber}
        isOpen={!!editBarber}
        onOpenChange={(open) => { if (!open) setEditBarber(null) }}
      />
    </div>
  )
}

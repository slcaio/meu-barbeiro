'use client'

import { Button } from '@/components/ui/button'
import { deleteClient } from '@/app/clients/actions'
import { Trash2, Search, Pencil } from 'lucide-react'
import { useTransition, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Database } from '@/types/database.types'
import { formatPhone, formatCPF, cn } from '@/lib/utils'
import { EditClientDialog } from './edit-client-dialog'

type Client = Database['public']['Tables']['clients']['Row']
type ActiveFilter = 'all' | 'incomplete'

export function ClientList({ clients }: { clients: Client[] }) {
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const incompleteCount = clients.filter(c => !c.cpf && !c.email).length

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      startTransition(async () => {
        await deleteClient(id)
      })
    }
  }

  const handleEdit = (client: Client) => {
    setEditClient(client)
    setIsEditOpen(true)
  }

  const filteredClients = clients.filter(client => {
    if (activeFilter === 'incomplete' && (client.cpf || client.email)) return false

    const searchLower = searchTerm.toLowerCase()
    if (!searchLower) return true

    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(searchLower) ||
      client.cpf?.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, email, telefone ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex rounded-md border overflow-hidden shrink-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            Todos
            <span className={cn(
              'ml-2 rounded-full px-1.5 py-0.5 text-xs',
              activeFilter === 'all'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted-foreground/20 text-muted-foreground'
            )}>
              {clients.length}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter('incomplete')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-l',
              activeFilter === 'incomplete'
                ? 'bg-amber-500 text-white'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            Dados incompletos
            <span className={cn(
              'ml-2 rounded-full px-1.5 py-0.5 text-xs',
              activeFilter === 'incomplete'
                ? 'bg-white/20 text-white'
                : 'bg-amber-500/10 text-amber-600'
            )}>
              {incompleteCount}
            </span>
          </button>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nome</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Telefone</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">CPF</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  {activeFilter === 'incomplete'
                    ? 'Nenhum cliente com dados incompletos.'
                    : 'Nenhum cliente encontrado.'}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{client.name}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">{client.phone ? formatPhone(client.phone) : '-'}</td>
                  <td className="p-4 align-middle">
                    {client.email ? client.email : (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Faltando
                      </span>
                    )}
                  </td>
                  <td className="p-4 align-middle">
                    {client.cpf ? formatCPF(client.cpf) : (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Faltando
                      </span>
                    )}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
                        onClick={() => handleEdit(client)}
                        disabled={isPending}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-500/10 h-8 w-8"
                        onClick={() => handleDelete(client.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditClientDialog
        client={editClient}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </div>
  )
}


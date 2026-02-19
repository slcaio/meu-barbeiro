'use client'

import { Button } from '@/components/ui/button'
import { deleteClient } from '@/app/clients/actions'
import { Trash2, Search } from 'lucide-react'
import { useTransition, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Database } from '@/types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

export function ClientList({ clients }: { clients: Client[] }) {
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      startTransition(async () => {
        await deleteClient(id)
      })
    }
  }

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase()
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(searchLower)
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nome</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Telefone</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{client.name}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">{client.phone || '-'}</td>
                  <td className="p-4 align-middle">{client.email || '-'}</td>
                  <td className="p-4 align-middle text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                      onClick={() => handleDelete(client.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

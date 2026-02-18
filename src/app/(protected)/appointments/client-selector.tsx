'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Search, X } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface ClientSelectorProps {
  clients: Client[]
  onSelect: (client: Client) => void
  onNewClient: () => void
}

export function ClientSelector({ clients, onSelect, onNewClient }: ClientSelectorProps) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    (client.phone && client.phone.includes(search))
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [wrapperRef])

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      <Label>Buscar Cliente</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Nome ou telefone..." 
            className="pl-8" 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {search && (
            <button 
              type="button"
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setSearch('')
                setShowDropdown(false)
              }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="button" variant="outline" onClick={onNewClient} title="Novo Cliente">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showDropdown && search && (
        <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {filteredClients.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              Nenhum cliente encontrado.
            </div>
          ) : (
            filteredClients.map(client => (
              <div 
                key={client.id}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center border-b last:border-0"
                onClick={() => {
                  onSelect(client)
                  setSearch('')
                  setShowDropdown(false)
                }}
              >
                <span className="font-medium">{client.name}</span>
                <span className="text-muted-foreground text-xs">{client.phone}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

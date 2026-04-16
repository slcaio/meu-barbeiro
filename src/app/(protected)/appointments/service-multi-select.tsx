'use client'

import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ServiceOption } from '@/types/database.types'

interface ServiceMultiSelectProps {
  services: ServiceOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

const currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function ServiceMultiSelect({ services, selectedIds, onChange }: ServiceMultiSelectProps) {
  const availableServices = services.filter(s => !selectedIds.includes(s.id))
  const selectedServices = selectedIds
    .map(id => services.find(s => s.id === id))
    .filter((s): s is ServiceOption => !!s)

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0)

  const handleAdd = (serviceId: string) => {
    if (serviceId && !selectedIds.includes(serviceId)) {
      onChange([...selectedIds, serviceId])
    }
  }

  const handleRemove = (serviceId: string) => {
    onChange(selectedIds.filter(id => id !== serviceId))
  }

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Serviços</span>

      {/* Selected services as chips */}
      {selectedServices.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedServices.map(service => (
            <div
              key={service.id}
              className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
            >
              <span>{service.name}</span>
              <span className="text-xs opacity-70">
                {currencyFormat.format(service.price)}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(service.id)}
                className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add service dropdown */}
      {availableServices.length > 0 && (
        <Select onValueChange={handleAdd} value="">
          <SelectTrigger className="w-full">
            <SelectValue placeholder={selectedIds.length === 0 ? 'Selecione um serviço' : '+ Adicionar serviço'} />
          </SelectTrigger>
          <SelectContent>
            {availableServices.map(service => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} - {currencyFormat.format(service.price)} ({service.duration_minutes}min)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Summary */}
      {selectedServices.length > 0 && (
        <div className="text-xs text-muted-foreground flex justify-between border-t pt-2">
          <span>{selectedServices.length} serviço{selectedServices.length > 1 ? 's' : ''} • {totalDuration}min</span>
          <span className="font-medium text-foreground">{currencyFormat.format(totalPrice)}</span>
        </div>
      )}
    </div>
  )
}

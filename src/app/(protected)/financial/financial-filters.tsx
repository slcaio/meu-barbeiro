'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FinancialFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
    to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
  })

  const currentPeriod = searchParams.get('period') || 'month'
  const currentType = searchParams.get('type') || 'all'
  const currentCategory = searchParams.get('category') || 'all'

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', value)

    const today = new Date()
    let from, to

    switch (value) {
      case 'today':
        from = today
        to = today
        break
      case 'week':
        from = startOfWeek(today, { locale: ptBR })
        to = endOfWeek(today, { locale: ptBR })
        break
      case 'month':
        from = startOfMonth(today)
        to = endOfMonth(today)
        break
      case 'last_month':
        const lastMonth = subMonths(today, 1)
        from = startOfMonth(lastMonth)
        to = endOfMonth(lastMonth)
        break
      case 'custom':
        from = date?.from
        to = date?.to
        break
    }

    if (value !== 'custom' && from && to) {
      params.set('from', from.toISOString())
      params.set('to', to.toISOString())
      setDate({ from, to })
    }

    router.push(`?${params.toString()}`)
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range)
    if (range?.from) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('from', range.from.toISOString())
      if (range.to) {
        params.set('to', range.to.toISOString())
      } else {
        params.delete('to')
      }
      params.set('period', 'custom')
      router.push(`?${params.toString()}`)
    }
  }

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', value)
    router.push(`?${params.toString()}`)
  }

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end sm:items-center flex-wrap">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Período</span>
        <Select value={currentPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="last_month">Mês Passado</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {currentPeriod === 'custom' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Datas</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd/MM/y", { locale: ptBR })} -{" "}
                      {format(date.to, "dd/MM/y", { locale: ptBR })}
                    </>
                  ) : (
                    format(date.from, "dd/MM/y", { locale: ptBR })
                  )
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Tipo</span>
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Categoria</span>
        <Select value={currentCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Serviço">Serviço</SelectItem>
            <SelectItem value="Produto">Produto</SelectItem>
            <SelectItem value="Aluguel">Aluguel</SelectItem>
            <SelectItem value="Contas">Contas</SelectItem>
            <SelectItem value="Salário">Salário</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

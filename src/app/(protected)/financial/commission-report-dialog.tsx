'use client'

import { useState, useEffect, useTransition } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, FileText } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { getCommissionReport } from '@/app/financial/actions'
import { getBarbers } from '@/app/barbers/actions'

type CommissionItem = {
  barberId: string
  barberName: string
  commissionPercentage: number
  totalAppointments: number
  totalRevenue: number
  commissionAmount: number
  appointments: {
    id: string
    date: string
    description: string
    amount: number
    commission: number
    type: 'service' | 'product'
  }[]
}

type ReportData = {
  barbers: { id: string; name: string }[]
  items: CommissionItem[]
  totals: { totalRevenue: number; totalCommission: number; totalAppointments: number }
}

type Barber = { id: string; name: string }

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function CommissionReportDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [report, setReport] = useState<ReportData | null>(null)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarber, setSelectedBarber] = useState('all')
  const [expandedBarbers, setExpandedBarbers] = useState<Set<string>>(new Set())
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  useEffect(() => {
    if (isOpen) {
      getBarbers()
        .then(data => setBarbers(data.map(b => ({ id: b.id, name: b.name }))))
        .catch(() => setBarbers([]))
    }
  }, [isOpen])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setReport(null)
      setSelectedBarber('all')
      setExpandedBarbers(new Set())
      setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
    }
  }

  const handleGenerate = () => {
    if (!date?.from || !date?.to) return

    startTransition(async () => {
      const result = await getCommissionReport({
        from: date.from!.toISOString(),
        to: date.to!.toISOString(),
        barberId: selectedBarber !== 'all' ? selectedBarber : undefined,
      })

      if (result.data) {
        setReport(result.data)
      }
    })
  }

  const toggleBarber = (barberId: string) => {
    setExpandedBarbers(prev => {
      const next = new Set(prev)
      if (next.has(barberId)) {
        next.delete(barberId)
      } else {
        next.add(barberId)
      }
      return next
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" /> Relatório de Comissões
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório de Comissões</DialogTitle>
          <DialogDescription>
            Visualize as comissões dos barbeiros por período.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-1">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            {/* Período — ocupa as 2 colunas */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <span className="text-sm font-medium">Período</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {date?.from ? (
                        date.to ? (
                          `${format(date.from, 'dd/MM/yy', { locale: ptBR })} – ${format(date.to, 'dd/MM/yy', { locale: ptBR })}`
                        ) : (
                          format(date.from, 'dd/MM/yy', { locale: ptBR })
                        )
                      ) : (
                        'Selecione o período'
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={1}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Barbeiro */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Barbeiro</span>
              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {barbers.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gerar — alinha ao fundo da segunda coluna */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium invisible">Ação</span>
              <Button className="w-full" onClick={handleGenerate} disabled={isPending || !date?.from || !date?.to}>
                {isPending ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
            </div>
          </div>

          {/* Results */}
          {report && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Atendimentos</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="text-lg sm:text-xl font-bold">{report.totals.totalAppointments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Receita Gerada</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(report.totals.totalRevenue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Total Comissões</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">{formatBRL(report.totals.totalCommission)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Per Barber Breakdown */}
              {report.items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum atendimento com barbeiro encontrado neste período.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.items.map(item => (
                    <div key={item.barberId} className="border rounded-lg overflow-hidden">
                      {/* Barber Header */}
                      <button
                        type="button"
                        onClick={() => toggleBarber(item.barberId)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        {/* Avatar */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                          {item.barberName.charAt(0).toUpperCase()}
                        </div>

                        {/* Name + meta — takes remaining space */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.barberName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.totalAppointments} atendimento{item.totalAppointments !== 1 ? 's' : ''} • {item.commissionPercentage}% comissão
                          </p>
                          {/* Commission values — shown inline on sm+, below name on mobile */}
                          <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                            <span className="text-xs font-semibold text-amber-600">{formatBRL(item.commissionAmount)}</span>
                            <span className="text-xs text-muted-foreground">de {formatBRL(item.totalRevenue)}</span>
                          </div>
                        </div>

                        {/* Commission values — visible only on sm+ */}
                        <div className="hidden sm:block text-right shrink-0">
                          <p className="text-sm font-semibold text-amber-600">{formatBRL(item.commissionAmount)}</p>
                          <p className="text-xs text-muted-foreground">de {formatBRL(item.totalRevenue)}</p>
                        </div>

                        {expandedBarbers.has(item.barberId) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {/* Expanded Appointments */}
                      {expandedBarbers.has(item.barberId) && (
                        <div className="border-t bg-muted/20">
                          <div className="divide-y">
                            {item.appointments.map(apt => (
                              <div key={apt.id} className="px-4 py-3 text-sm">
                                {/* Mobile: stacked layout */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <p className="font-medium truncate">{apt.description}</p>
                                      {apt.type === 'product' && (
                                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                                          Produto
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {new Date(apt.date).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {apt.amount > 0 && (
                                      <p className="text-xs text-muted-foreground">{formatBRL(apt.amount)}</p>
                                    )}
                                    <p className="text-xs font-semibold text-amber-600">{formatBRL(apt.commission)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

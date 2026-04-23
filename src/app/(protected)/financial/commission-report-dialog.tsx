'use client'

import { useState, useEffect, useTransition } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, FileText, Download, FileDown } from 'lucide-react'

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

  const handleExportCSV = () => {
    if (!report) return

    const dateLabel = date?.from && date?.to
      ? `${format(date.from, 'dd-MM-yyyy', { locale: ptBR })}_${format(date.to, 'dd-MM-yyyy', { locale: ptBR })}`
      : 'periodo'

    const selectedBarberName = selectedBarber !== 'all'
      ? barbers.find(b => b.id === selectedBarber)?.name
      : undefined
    const barberLabel = selectedBarberName
      ? `_${selectedBarberName.toLowerCase().replace(/\s+/g, '-')}`
      : ''

    const rows: string[][] = []

    rows.push(['Relatório de Comissões'])
    rows.push([`Período: ${date?.from ? format(date.from, 'dd/MM/yyyy', { locale: ptBR }) : ''} a ${date?.to ? format(date.to, 'dd/MM/yyyy', { locale: ptBR }) : ''}`])
    rows.push([])
    rows.push(['Barbeiro', 'Data', 'Descrição', 'Tipo', 'Receita (R$)', 'Comissão (R$)'])

    for (const item of report.items) {
      for (const apt of item.appointments) {
        rows.push([
          item.barberName,
          new Date(apt.date).toLocaleDateString('pt-BR'),
          apt.description,
          apt.type === 'service' ? 'Serviço' : 'Produto',
          apt.amount > 0 ? apt.amount.toFixed(2).replace('.', ',') : '',
          apt.commission.toFixed(2).replace('.', ','),
        ])
      }
      rows.push([
        `SUBTOTAL — ${item.barberName}`,
        '',
        `${item.totalAppointments} atendimento(s) • ${item.commissionPercentage}%`,
        '',
        item.totalRevenue.toFixed(2).replace('.', ','),
        item.commissionAmount.toFixed(2).replace('.', ','),
      ])
      rows.push([])
    }

    rows.push([
      'TOTAL GERAL',
      '',
      `${report.totals.totalAppointments} atendimento(s)`,
      '',
      report.totals.totalRevenue.toFixed(2).replace('.', ','),
      report.totals.totalCommission.toFixed(2).replace('.', ','),
    ])

    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comissoes_${dateLabel}${barberLabel}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async () => {
    if (!report) return

    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    type JsPDFWithAutoTable = InstanceType<typeof jsPDF> & { lastAutoTable: { finalY: number } }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPDFWithAutoTable
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 15

    // Color palette
    const DARK: [number, number, number] = [30, 30, 46]
    const AMBER: [number, number, number] = [217, 119, 6]
    const EMERALD: [number, number, number] = [5, 150, 105]
    const GRAY: [number, number, number] = [107, 114, 128]
    const LIGHT: [number, number, number] = [249, 250, 251]
    const WHITE: [number, number, number] = [255, 255, 255]

    const selectedBarberName = selectedBarber !== 'all'
      ? barbers.find(b => b.id === selectedBarber)?.name
      : undefined
    const periodLabel = date?.from && date?.to
      ? `${format(date.from, 'dd/MM/yyyy', { locale: ptBR })} a ${format(date.to, 'dd/MM/yyyy', { locale: ptBR })}`
      : ''
    const barberLabel = selectedBarberName ?? 'Todos os barbeiros'

    // --- HEADER ---
    doc.setFillColor(...DARK)
    doc.rect(0, 0, pageW, 38, 'F')

    // Decorative accent bar
    doc.setFillColor(...AMBER)
    doc.rect(0, 33, pageW, 5, 'F')

    doc.setTextColor(...WHITE)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Relatório de Comissões', margin, 15)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${periodLabel}`, margin, 24)
    doc.text(`Barbeiro: ${barberLabel}`, margin, 30)

    doc.setTextColor(180, 180, 180)
    doc.setFontSize(7.5)
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageW - margin, 30, { align: 'right' })

    let y = 50

    // --- SUMMARY CARDS ---
    const cardW = (pageW - margin * 2 - 8) / 3

    // Card 1: Atendimentos
    doc.setFillColor(...LIGHT)
    doc.roundedRect(margin, y, cardW, 22, 2, 2, 'F')
    doc.setTextColor(...GRAY)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('ATENDIMENTOS', margin + cardW / 2, y + 7, { align: 'center' })
    doc.setTextColor(...DARK)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(String(report.totals.totalAppointments), margin + cardW / 2, y + 17, { align: 'center' })

    // Card 2: Receita
    const c2x = margin + cardW + 4
    doc.setFillColor(236, 253, 245)
    doc.roundedRect(c2x, y, cardW, 22, 2, 2, 'F')
    doc.setTextColor(...GRAY)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('RECEITA GERADA', c2x + cardW / 2, y + 7, { align: 'center' })
    doc.setTextColor(...EMERALD)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBRL(report.totals.totalRevenue), c2x + cardW / 2, y + 17, { align: 'center' })

    // Card 3: Comissões
    const c3x = margin + (cardW + 4) * 2
    doc.setFillColor(255, 251, 235)
    doc.roundedRect(c3x, y, cardW, 22, 2, 2, 'F')
    doc.setTextColor(...GRAY)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('TOTAL COMISSÕES', c3x + cardW / 2, y + 7, { align: 'center' })
    doc.setTextColor(...AMBER)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(formatBRL(report.totals.totalCommission), c3x + cardW / 2, y + 17, { align: 'center' })

    y += 32

    // --- PER BARBER SECTIONS ---
    for (const item of report.items) {
      if (y > 245) {
        doc.addPage()
        y = 15
      }

      // Barber section header
      doc.setFillColor(...DARK)
      doc.roundedRect(margin, y, pageW - margin * 2, 11, 1.5, 1.5, 'F')
      doc.setTextColor(...WHITE)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      const initial = item.barberName.charAt(0).toUpperCase()
      doc.text(initial, margin + 5.5, y + 7.5)
      doc.setFontSize(8)
      doc.text(
        `${item.barberName}  •  ${item.commissionPercentage}% comissão  •  ${item.totalAppointments} atendimento(s)`,
        margin + 13, y + 7.5
      )
      doc.text(
        `Receita: ${formatBRL(item.totalRevenue)}  |  Comissão: ${formatBRL(item.commissionAmount)}`,
        pageW - margin - 3, y + 7.5,
        { align: 'right' }
      )
      y += 13

      if (item.appointments.length === 0) {
        doc.setTextColor(...GRAY)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.text('Nenhum atendimento neste período.', margin + 3, y + 4)
        y += 10
        continue
      }

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Data', 'Descrição', 'Tipo', 'Receita', 'Comissão']],
        body: item.appointments.map(apt => [
          new Date(apt.date).toLocaleDateString('pt-BR'),
          apt.description,
          apt.type === 'service' ? 'Serviço' : 'Produto',
          apt.amount > 0 ? formatBRL(apt.amount) : '—',
          formatBRL(apt.commission),
        ]),
        foot: [[
          { content: 'Subtotal', colSpan: 3, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
          { content: formatBRL(item.totalRevenue), styles: { fontStyle: 'bold' as const, textColor: EMERALD } },
          { content: formatBRL(item.commissionAmount), styles: { fontStyle: 'bold' as const, textColor: AMBER } },
        ]],
        headStyles: { fillColor: [55, 65, 81], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
        footStyles: { fontSize: 8, fillColor: [243, 244, 246] },
        alternateRowStyles: { fillColor: [252, 252, 253] },
        columnStyles: {
          0: { cellWidth: 22 },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
        },
      })

      y = doc.lastAutoTable.finalY + 8
    }

    // --- TOTAL GERAL ---
    if (y > 255) { doc.addPage(); y = 15 }

    doc.setFillColor(...AMBER)
    doc.rect(margin, y, pageW - margin * 2, 12, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL GERAL', margin + 4, y + 8)
    doc.text(
      `${report.totals.totalAppointments} atendimentos  |  Receita: ${formatBRL(report.totals.totalRevenue)}  |  Comissões: ${formatBRL(report.totals.totalCommission)}`,
      pageW - margin - 4, y + 8, { align: 'right' }
    )

    // --- FOOTER em todas as páginas ---
    const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setTextColor(...GRAY)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Página ${i} de ${totalPages}  •  Meu Barbeiro`,
        pageW / 2, doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    }

    const dateLabel = date?.from && date?.to
      ? `${format(date.from, 'dd-MM-yyyy', { locale: ptBR })}_${format(date.to, 'dd-MM-yyyy', { locale: ptBR })}`
      : 'periodo'
    const fileBarberLabel = selectedBarberName
      ? `_${selectedBarberName.toLowerCase().replace(/\s+/g, '-')}`
      : ''

    doc.save(`comissoes_${dateLabel}${fileBarberLabel}.pdf`)
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
              {/* Results header with export button */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Resultados</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <FileDown className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>

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

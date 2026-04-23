'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, Layers3, User, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMonthlyAppointments } from '@/app/appointments/actions'
import { formatCurrency, formatPhone, parseCurrency } from '@/lib/utils'
import type {
  BarberOption,
  ClientOption,
  PaymentMethodWithInstallments,
  ServiceOption,
} from '@/types/database.types'

import { ClientSelector } from './client-selector'
import { ServiceMultiSelect } from './service-multi-select'
import { buildMonthlyAppointmentPreviewDates } from './monthly-appointment-utils'

interface CreateMonthlyAppointmentsDialogProps {
  services: ServiceOption[]
  clients: ClientOption[]
  barbers: BarberOption[]
  paymentMethods: PaymentMethodWithInstallments[]
  initialBarberId?: string
}

const disablePastDates = (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function CreateMonthlyAppointmentsDialog({
  services,
  clients,
  barbers,
  paymentMethods,
  initialBarberId,
}: CreateMonthlyAppointmentsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [isNewClientMode, setIsNewClientMode] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [barberId, setBarberId] = useState(initialBarberId ?? '')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date())
  const [timeStr, setTimeStr] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('')
  const [selectedInstallments, setSelectedInstallments] = useState(1)
  const [packageDiscountAmount, setPackageDiscountAmount] = useState('')

  useEffect(() => {
    if (selectedClient) {
      setClientName(selectedClient.name)
      setClientPhone(formatPhone(selectedClient.phone || ''))
    } else if (!isNewClientMode) {
      setClientName('')
      setClientPhone('')
    }
  }, [selectedClient, isNewClientMode])

  useEffect(() => {
    if (isOpen) {
      setBarberId(initialBarberId ?? '')
    }
  }, [initialBarberId, isOpen])

  const previewDates = useMemo(
    () => buildMonthlyAppointmentPreviewDates(selectedDate, timeStr),
    [selectedDate, timeStr]
  )

  const selectedServices = useMemo(
    () => services.filter((service) => serviceIds.includes(service.id)),
    [services, serviceIds]
  )

  const serviceTotal = selectedServices.reduce((sum, service) => sum + service.price, 0)
  const grossPackageAmount = serviceTotal * previewDates.length
  const parsedDiscountAmount = parseCurrency(packageDiscountAmount)
  const appliedDiscountAmount = Math.min(parsedDiscountAmount, grossPackageAmount)
  const totalPackageAmount = Math.max(grossPackageAmount - appliedDiscountAmount, 0)
  const selectedMethod = paymentMethods.find((method) => method.id === selectedPaymentMethodId)

  const installmentOptions = useMemo(() => {
    if (!selectedMethod || totalPackageAmount <= 0) {
      return [{ value: 1, label: '1x à vista' }]
    }

    if (!selectedMethod.supports_installments) {
      return [{ value: 1, label: '1x à vista' }]
    }

    return [
      { value: 1, label: '1x à vista' },
      ...selectedMethod.payment_method_installments
        .slice()
        .sort((left, right) => left.installment_number - right.installment_number)
        .map((installment) => ({
          value: installment.installment_number,
          label: `${installment.installment_number}x de ${formatBRL(totalPackageAmount / installment.installment_number)} (${installment.fee_percentage}% taxa)`,
        })),
    ]
  }, [selectedMethod, totalPackageAmount])

  const resetForm = () => {
    setSelectedClient(null)
    setIsNewClientMode(false)
    setClientName('')
    setClientPhone('')
    setServiceIds([])
    setBarberId(initialBarberId ?? '')
    setSelectedDate(new Date())
    setTimeStr('')
    setNotes('')
    setSelectedPaymentMethodId('')
    setSelectedInstallments(1)
    setPackageDiscountAmount('')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const handleClientSelect = (client: ClientOption) => {
    setSelectedClient(client)
    setIsNewClientMode(false)
  }

  const handleNewClient = () => {
    setSelectedClient(null)
    setIsNewClientMode(true)
    setClientName('')
    setClientPhone('')
  }

  const handleClearClient = () => {
    setSelectedClient(null)
    setIsNewClientMode(false)
    setClientName('')
    setClientPhone('')
  }

  const handleSubmit = async (formData: FormData) => {
    if (!selectedPaymentMethodId) {
      alert('Selecione um método de pagamento.')
      return
    }

    if (!selectedDate || !timeStr) {
      alert('Selecione data e horário.')
      return
    }

    if (serviceIds.length === 0) {
      alert('Selecione ao menos um serviço.')
      return
    }

    if (previewDates.length === 0) {
      alert('Não foi possível gerar os agendamentos do pacote mensal.')
      return
    }

    formData.set('appointment_date', previewDates[0].toISOString())
    formData.set('payment_method_id', selectedPaymentMethodId)
    formData.set('installments', String(selectedInstallments))
    formData.set('package_discount_amount', String(appliedDiscountAmount))

    const result = await createMonthlyAppointments(formData)
    if (result?.success) {
      handleOpenChange(false)
    } else if (result?.error) {
      alert(result.error)
    }
  }

  const selectClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="h-8 w-auto px-2.5 text-xs sm:h-9 sm:px-4 sm:text-sm"
      >
        <Layers3 className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> Pacote Mensal
      </Button>

      <Modal isOpen={isOpen} onClose={() => handleOpenChange(false)} title="Pacote Mensal de Cortes">
        <form action={handleSubmit} className="space-y-4 pr-1">
          <div className="space-y-4 border-b pb-4">
            {!selectedClient && !isNewClientMode ? (
              <ClientSelector
                clients={clients}
                onSelect={handleClientSelect}
                onNewClient={handleNewClient}
              />
            ) : (
              <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isNewClientMode ? 'Novo Cliente' : selectedClient?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isNewClientMode
                        ? 'Preencha os dados abaixo'
                        : (selectedClient?.phone ? formatPhone(selectedClient.phone) : 'Sem telefone')}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={handleClearClient}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <input type="hidden" name="client_id" value={selectedClient?.id || ''} />
          <input type="hidden" name="is_new_client" value={isNewClientMode ? 'true' : 'false'} />
          <input type="hidden" name="service_ids" value={JSON.stringify(serviceIds)} />

          {(selectedClient || isNewClientMode) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="monthly_client_name">Nome do Cliente</Label>
                <Input
                  id="monthly_client_name"
                  name="client_name"
                  required
                  placeholder="Nome completo"
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  readOnly={!!selectedClient}
                  className={selectedClient ? 'bg-muted' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_client_phone">Telefone (Opcional)</Label>
                <Input
                  id="monthly_client_phone"
                  name="client_phone"
                  placeholder="(00) 00000-0000"
                  value={clientPhone}
                  onChange={(event) => setClientPhone(formatPhone(event.target.value))}
                  readOnly={!!selectedClient}
                  className={selectedClient ? 'bg-muted' : ''}
                />
              </div>
            </>
          )}

          <ServiceMultiSelect services={services} selectedIds={serviceIds} onChange={setServiceIds} />

          {barbers.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Barbeiro</span>
              <Select name="barber_id" value={barberId} onValueChange={setBarberId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar barbeiro (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.filter((barber) => barber.is_active).map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Data inicial</span>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                disabled={disablePastDates}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Hora</span>
              <TimePicker value={timeStr} onChange={setTimeStr} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_notes">Observações (Opcional)</Label>
            <Input
              id="monthly_notes"
              name="notes"
              placeholder="Ex: cliente do plano mensal"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_discount">Desconto no pacote (Opcional)</Label>
            <Input
              id="monthly_discount"
              name="package_discount_amount_display"
              type="text"
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={packageDiscountAmount}
              onChange={(event) => setPackageDiscountAmount(formatCurrency(event.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              O desconto é aplicado no valor total do pacote antes do recebimento.
            </p>
            {parsedDiscountAmount > grossPackageAmount && grossPackageAmount > 0 && (
              <p className="text-xs text-amber-600">
                O desconto será limitado ao valor total do pacote.
              </p>
            )}
          </div>

          <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
            <Label htmlFor="monthly_payment_method">Método de Pagamento *</Label>
            <select
              id="monthly_payment_method"
              value={selectedPaymentMethodId}
              onChange={(event) => {
                setSelectedPaymentMethodId(event.target.value)
                setSelectedInstallments(1)
              }}
              className={selectClass}
              required
            >
              <option value="">Selecione...</option>
              {paymentMethods.map((paymentMethod) => (
                <option key={paymentMethod.id} value={paymentMethod.id}>
                  {paymentMethod.name}
                  {paymentMethod.supports_installments ? ' • Parcelável' : ''}
                </option>
              ))}
            </select>

            {selectedMethod?.supports_installments && installmentOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="monthly_installments">Parcelas</Label>
                <select
                  id="monthly_installments"
                  value={selectedInstallments}
                  onChange={(event) => setSelectedInstallments(Number(event.target.value))}
                  className={selectClass}
                >
                  {installmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {paymentMethods.length === 0 && (
              <p className="text-xs text-amber-600">
                Nenhum método de pagamento cadastrado. Cadastre em Configurações → Métodos de Pagamento.
              </p>
            )}
          </div>

          <div className="space-y-3 border rounded-lg p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-2">
              <CalendarRange className="h-4 w-4 mt-0.5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Prévia do pacote mensal</p>
                <p className="text-xs text-muted-foreground">
                  O sistema vai repetir semanalmente por um mês a partir da primeira data, com no máximo 4 cortes.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground">Atendimentos</p>
                <p className="text-lg font-semibold">{previewDates.length}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground">Valor por atendimento</p>
                <p className="text-lg font-semibold">{formatBRL(serviceTotal)}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground">Total do pacote</p>
                <p className="text-lg font-semibold text-primary">{formatBRL(totalPackageAmount)}</p>
              </div>
            </div>

            {(grossPackageAmount > 0 || appliedDiscountAmount > 0) && (
              <div className="rounded-md border bg-background p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor bruto</span>
                  <span>{formatBRL(grossPackageAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="text-emerald-600">-{formatBRL(appliedDiscountAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold border-t pt-2">
                  <span>Total final</span>
                  <span className="text-primary">{formatBRL(totalPackageAmount)}</span>
                </div>
              </div>
            )}

            {previewDates.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Datas geradas
                </p>
                <div className="rounded-md border bg-background p-3 space-y-1">
                  {previewDates.map((previewDate) => (
                    <p key={previewDate.toISOString()} className="text-sm text-foreground/80">
                      {format(previewDate, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Defina a hora para visualizar as datas do pacote mensal.
              </p>
            )}
          </div>

          <div className="pt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingText="Criando pacote...">Criar Pacote Mensal</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  )
}
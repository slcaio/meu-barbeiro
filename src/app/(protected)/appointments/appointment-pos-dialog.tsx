'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeAppointmentWithTransaction } from '@/app/appointments/actions'
import { Loader2, Plus, Trash2, Package } from 'lucide-react'
import { formatCurrency, parseCurrency } from '@/lib/utils'
import type { AppointmentWithRelations, PaymentMethodWithInstallments, ProductOption, BarberOption } from '@/types/database.types'

interface ProductRow {
  product_id: string
  quantity: number
  price_at_time: number
  barber_id: string
}

interface AppointmentPOSDialogProps {
  appointment: AppointmentWithRelations
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  action: 'complete' | 'cancel'
  paymentMethods: PaymentMethodWithInstallments[]
  products?: ProductOption[]
  barbers?: BarberOption[]
}

export function AppointmentPOSDialog({
  appointment,
  isOpen,
  onOpenChange,
  action,
  paymentMethods,
  products = [],
  barbers = [],
}: AppointmentPOSDialogProps) {
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('')
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1)
  const [productRows, setProductRows] = useState<ProductRow[]>([])
  const [cancelScope, setCancelScope] = useState<'single' | 'batch'>('single')

  const defaultBarberId = appointment?.barber_id || ''
  const servicesAlreadyPaid = action === 'complete' && appointment?.payment_status === 'paid'

  useEffect(() => {
    if (isOpen && appointment) {
      setSelectedPaymentMethodId(servicesAlreadyPaid ? (appointment.payment_method_id || '') : '')
      setSelectedInstallments(servicesAlreadyPaid ? appointment.installments || 1 : 1)
      setProductRows([])
      setCancelScope('single')

      const serviceNames = appointment.appointment_services
        .map(as => as.services?.name)
        .filter(Boolean)
        .join(', ')
      const totalPrice = appointment.appointment_services.reduce((sum, as) => sum + as.price_at_time, 0)

      if (action === 'complete') {
        setAmount(formatCurrency(totalPrice.toFixed(2)))
        setDescription(`Serviços: ${serviceNames} - Cliente: ${appointment.client_name}`)
      } else {
        setAmount('R$ 0,00')
        setDescription(`Taxa de cancelamento - Serviços: ${serviceNames} - Cliente: ${appointment.client_name}`)
      }
    }
  }, [isOpen, appointment, action, servicesAlreadyPaid])

  useEffect(() => {
    if (!isOpen || action !== 'cancel' || !appointment?.batch_id) {
      return
    }

    if (cancelScope === 'batch') {
      setAmount('R$ 0,00')
      setDescription(`Cancelamento do pacote mensal - Cliente: ${appointment.client_name}`)
      return
    }

    const serviceNames = appointment.appointment_services
      .map(as => as.services?.name)
      .filter(Boolean)
      .join(', ')
    setDescription(`Taxa de cancelamento - Serviços: ${serviceNames} - Cliente: ${appointment.client_name}`)
  }, [action, appointment, cancelScope, isOpen])

  // Product row handlers
  const addProductRow = () => {
    setProductRows(prev => [...prev, { product_id: '', quantity: 1, price_at_time: 0, barber_id: defaultBarberId }])
  }

  const removeProductRow = (index: number) => {
    setProductRows(prev => prev.filter((_, i) => i !== index))
  }

  const updateProductRow = (index: number, field: keyof ProductRow, value: string | number) => {
    setProductRows(prev => prev.map((row, i) => {
      if (i !== index) return row
      if (field === 'product_id') {
        const product = products.find(p => p.id === value)
        return { ...row, product_id: value as string, price_at_time: product?.sale_price ?? 0 }
      }
      return { ...row, [field]: value }
    }))
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      setAmount('')
      return
    }
    const numericValue = value.replace(/\D/g, '')
    const formatted = formatCurrency(numericValue)
    setAmount(formatted)
  }

  const handlePaymentMethodChange = (id: string) => {
    setSelectedPaymentMethodId(id)
    setSelectedInstallments(1)
  }

  // Totals
  const servicesAmount = parseCurrency(amount)
  const productsTotal = productRows.reduce((sum, row) => sum + row.quantity * row.price_at_time, 0)
  const grandTotal = servicesAmount + productsTotal
  const checkoutTotal = servicesAlreadyPaid ? productsTotal : grandTotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validProducts = productRows.filter(r => r.product_id && r.quantity > 0)
    const requiresPaymentMethod = action === 'complete' && (!servicesAlreadyPaid || validProducts.length > 0)

    if (requiresPaymentMethod && !selectedPaymentMethodId) {
      alert('Selecione um método de pagamento.')
      return
    }

    // Validate product rows
    for (const row of validProducts) {
      const product = products.find(p => p.id === row.product_id)
      if (product && row.quantity > product.current_stock) {
        alert(`Estoque insuficiente para "${product.name}". Disponível: ${product.current_stock}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('appointment_id', appointment.id)
      formData.append('action', action)
      formData.append('amount', servicesAmount.toString())
      formData.append('description', description)
      formData.append('cancel_scope', cancelScope)

      if (selectedPaymentMethodId) {
        formData.append('payment_method_id', selectedPaymentMethodId)
      }

      formData.append('installments', selectedInstallments.toString())

      if (validProducts.length > 0) {
        formData.append('products_json', JSON.stringify(validProducts))
      }
      
      const result = await completeAppointmentWithTransaction(formData)

      if (result.error) {
        alert(result.error)
      } else {
        onOpenChange(false)
      }
    } catch (error) {
      console.error(error)
      alert('Ocorreu um erro ao processar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fee calculation on grand total (services + products)
  const selectedMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId)

  let feeAmount = 0
  let feeLabel = ''
  if (selectedMethod && checkoutTotal > 0) {
    if (selectedInstallments > 1 && selectedMethod.supports_installments) {
      const tier = selectedMethod.payment_method_installments.find(
        t => t.installment_number === selectedInstallments
      )
      if (tier) {
        feeAmount = checkoutTotal * (tier.fee_percentage / 100)
        feeLabel = `${selectedMethod.name} ${selectedInstallments}x - ${tier.fee_percentage}%`
      }
    } else {
      if (selectedMethod.fee_type === 'percentage') {
        feeAmount = checkoutTotal * (selectedMethod.fee_value / 100)
      } else {
        feeAmount = selectedMethod.fee_value
      }
      if (feeAmount > 0) {
        feeLabel = `${selectedMethod.name} ${selectedMethod.fee_type === 'percentage' ? `${selectedMethod.fee_value}%` : `R$ ${selectedMethod.fee_value.toFixed(2)}`}`
      }
    }
  }
  const feeFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(feeAmount)
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  // Build installment options
  const installmentOptions: { value: number; label: string; fee: number }[] = []
  if (selectedMethod?.supports_installments && checkoutTotal > 0) {
    const baseFee = selectedMethod.fee_type === 'percentage'
      ? checkoutTotal * (selectedMethod.fee_value / 100)
      : selectedMethod.fee_value
    installmentOptions.push({
      value: 1,
      label: `1x de ${fmt(checkoutTotal)}${baseFee > 0 ? ` (taxa ${selectedMethod.fee_value}%)` : ' (sem taxa)'}`,
      fee: baseFee,
    })
    const sortedTiers = [...selectedMethod.payment_method_installments].sort(
      (a, b) => a.installment_number - b.installment_number
    )
    for (const tier of sortedTiers) {
      const installmentValue = checkoutTotal / tier.installment_number
      installmentOptions.push({
        value: tier.installment_number,
        label: `${tier.installment_number}x de ${fmt(installmentValue)} (taxa ${tier.fee_percentage}%)`,
        fee: checkoutTotal * (tier.fee_percentage / 100),
      })
    }
  }

  const title = action === 'complete' ? 'Concluir Agendamento' : 'Cancelar Agendamento'
  const buttonText = action === 'complete'
    ? (servicesAlreadyPaid ? (productsTotal > 0 ? 'Concluir e Registrar Produtos' : 'Concluir Atendimento') : 'Concluir e Receber')
    : (cancelScope === 'batch' ? 'Cancelar pacote restante' : 'Confirmar Cancelamento')
  const buttonVariant = action === 'complete' ? 'default' : 'destructive'
  const showPaymentFields = action === 'complete' && (!servicesAlreadyPaid || productRows.length > 0)

  const selectClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <Modal isOpen={isOpen} onClose={() => onOpenChange(false)} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-muted p-3 rounded-md mb-4 text-sm text-foreground/80">
            <p><strong>Cliente:</strong> {appointment?.client_name}</p>
            <p><strong>Serviços:</strong> {appointment?.appointment_services?.map(as => as.services?.name).filter(Boolean).join(', ')}</p>
            {action === 'complete' && (
               <p><strong>Preço Padrão:</strong> {formatCurrency(
                 (appointment?.appointment_services?.reduce((sum, as) => sum + as.price_at_time, 0) ?? 0).toFixed(2)
               )}</p>
            )}
        </div>

        {servicesAlreadyPaid && action === 'complete' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-md text-sm text-emerald-700 dark:text-emerald-400">
            Os serviços deste atendimento já foram pagos no pacote mensal. Você só precisa concluir o atendimento e, se houver, registrar produtos extras.
          </div>
        )}

        {action === 'cancel' && appointment.batch_id && (
          <div className="space-y-2">
            <Label htmlFor="cancel_scope">Escopo do cancelamento</Label>
            <select
              id="cancel_scope"
              value={cancelScope}
              onChange={(event) => setCancelScope(event.target.value as 'single' | 'batch')}
              className={selectClass}
            >
              <option value="single">Cancelar apenas este agendamento</option>
              <option value="batch">Cancelar este e os próximos do pacote</option>
            </select>
            {cancelScope === 'batch' && (
              <p className="text-xs text-muted-foreground">
                O cancelamento em lote altera apenas o status dos agendamentos restantes do pacote. Estorno financeiro continua manual.
              </p>
            )}
          </div>
        )}

        {!(action === 'cancel' && cancelScope === 'batch') && (
          <div className="space-y-2">
            <Label htmlFor="amount">{servicesAlreadyPaid ? 'Serviços já pagos' : 'Valor dos Serviços'}</Label>
            <Input 
              id="amount" 
              value={amount}
              onChange={handleAmountChange}
              type="text" 
              inputMode="numeric"
              placeholder="R$ 0,00"
              required 
              readOnly={servicesAlreadyPaid}
              className={servicesAlreadyPaid ? 'bg-muted' : ''}
            />
            <p className="text-xs text-muted-foreground">
              {servicesAlreadyPaid
                ? 'Este valor foi quitado no pacote mensal e não será cobrado novamente.'
                : action === 'complete'
                  ? 'Você pode alterar o valor final dos serviços.'
                  : 'Se houver taxa de cancelamento, informe o valor acima. Caso contrário, mantenha 0.'}
            </p>
          </div>
        )}

        {/* Products section — only for complete action */}
        {action === 'complete' && products.length > 0 && (
          <div className="space-y-3 border border-border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos vendidos
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addProductRow}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {productRows.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Nenhum produto adicionado. Clique em &quot;Adicionar&quot; para vender junto.
              </p>
            )}

            {productRows.map((row, index) => {
              const selectedProduct = products.find(p => p.id === row.product_id)
              return (
                <div key={index} className="space-y-2 bg-muted/50 p-3 rounded-md relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeProductRow(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div>
                    <Label className="text-xs">Produto</Label>
                    <select
                      value={row.product_id}
                      onChange={(e) => updateProductRow(index, 'product_id', e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="">Selecione...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {fmt(p.sale_price)} (estoque: {p.current_stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Qtd</Label>
                      <Input
                        type="number"
                        min={1}
                        max={selectedProduct?.current_stock ?? 999}
                        value={row.quantity}
                        onChange={(e) => updateProductRow(index, 'quantity', Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Preço unitário</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={row.price_at_time}
                        onChange={(e) => updateProductRow(index, 'price_at_time', Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  {barbers.length > 0 && (
                    <div>
                      <Label className="text-xs">Barbeiro (comissão)</Label>
                      <select
                        value={row.barber_id}
                        onChange={(e) => updateProductRow(index, 'barber_id', e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Nenhum</option>
                        {barbers.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      {selectedProduct && selectedProduct.commission_percentage > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Comissão: {selectedProduct.commission_percentage}%
                        </p>
                      )}
                    </div>
                  )}

                  {selectedProduct && row.quantity > 0 && (
                    <p className="text-xs font-medium text-right">
                      Subtotal: {fmt(row.quantity * row.price_at_time)}
                    </p>
                  )}
                </div>
              )
            })}

            {productsTotal > 0 && (
              <p className="text-sm font-semibold text-right">
                Total Produtos: {fmt(productsTotal)}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Descrição da Transação</Label>
          <Input 
            id="description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required 
            readOnly={action === 'cancel' && cancelScope === 'batch'}
            className={action === 'cancel' && cancelScope === 'batch' ? 'bg-muted' : ''}
          />
        </div>

        {showPaymentFields && (
          <div className="space-y-2">
            <Label htmlFor="payment_method">
              {servicesAlreadyPaid ? 'Método de Pagamento dos Itens Cobrados Agora *' : 'Método de Pagamento *'}
            </Label>
            <select
              id="payment_method"
              value={selectedPaymentMethodId}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Selecione...</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}{pm.fee_value > 0 ? ` (${pm.fee_type === 'percentage' ? `${pm.fee_value}%` : `R$ ${pm.fee_value.toFixed(2)}`})` : ''}{pm.supports_installments ? ' • Parcelável' : ''}
                </option>
              ))}
            </select>
            {paymentMethods.length === 0 && (
              <p className="text-xs text-amber-600">
                Nenhum método de pagamento cadastrado. Cadastre em Configurações → Métodos de Pagamento.
              </p>
            )}
          </div>
        )}

        {action === 'complete' && selectedMethod?.supports_installments && installmentOptions.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="installments">Parcelas</Label>
            <select
              id="installments"
              value={selectedInstallments}
              onChange={(e) => setSelectedInstallments(Number(e.target.value))}
              className={selectClass}
            >
              {installmentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showPaymentFields && selectedMethod && feeAmount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md text-sm text-amber-600 dark:text-amber-400">
            <p><strong>Taxa ({feeLabel}):</strong> {feeFormatted}</p>
          </div>
        )}

        {/* Grand total summary */}
        {action === 'complete' && (productsTotal > 0 || feeAmount > 0 || servicesAlreadyPaid) && (
          <div className="bg-primary/5 border border-primary/20 p-3 rounded-md text-sm space-y-1">
            {servicesAlreadyPaid ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Serviços já quitados</span>
                <span>{fmt(servicesAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span>Serviços</span>
                <span>{fmt(servicesAmount)}</span>
              </div>
            )}
            {productsTotal > 0 && (
              <div className="flex justify-between">
                <span>Produtos</span>
                <span>{fmt(productsTotal)}</span>
              </div>
            )}
            {feeAmount > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Taxa</span>
                <span>-{feeFormatted}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-1 mt-1">
              <span>{servicesAlreadyPaid ? 'Total cobrado agora' : 'Total'}</span>
              <span>{fmt(checkoutTotal)}</span>
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-wrap justify-end gap-2 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Voltar
          </Button>
          <Button type="submit" variant={buttonVariant} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buttonText}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

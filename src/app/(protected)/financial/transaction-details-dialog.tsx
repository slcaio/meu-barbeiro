'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  CalendarDays,
  Tag,
  CreditCard,
  FileText,
  Link as LinkIcon,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { SubmitButton } from '@/components/ui/submit-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatCurrency as formatCurrencyMask, parseCurrency } from '@/lib/utils'
import { deleteTransaction, updateTransaction } from '@/app/financial/actions'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export interface TransactionDetail {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  source: 'appointment' | 'manual'
  paymentMethodName: string | null
  isCogs: boolean
  stockMovementId: string | null
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
}

interface TransactionDetailsDialogProps {
  transaction: TransactionDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
}

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
  categories,
}: TransactionDetailsDialogProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Editable state
  const [editType, setEditType] = useState<'income' | 'expense'>('expense')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (!transaction) return
    setMode('view')
    setErrorMsg(null)
    setConfirmDelete(false)
    setEditType(transaction.type)
    setEditAmount(formatCurrencyMask(Math.round(transaction.amount * 100).toString()))
    setEditCategory(transaction.category)
    setEditDescription(transaction.description === 'Sem descrição' ? '' : transaction.description)
    setEditDate(new Date(`${transaction.date}T12:00:00`))
  }, [transaction])

  if (!transaction) return null

  const isLocked = transaction.source === 'appointment' || transaction.isCogs || !!transaction.stockMovementId
  const isIncome = transaction.type === 'income'
  const formattedDate = new Date(`${transaction.date}T12:00:00`).toLocaleDateString('pt-BR')

  const accentClasses = transaction.isCogs
    ? 'text-amber-600 dark:text-amber-400'
    : isIncome
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'

  const Icon = transaction.isCogs ? Package : isIncome ? ArrowUpCircle : ArrowDownCircle

  const editableCategories = categories.filter((c) => c.type === editType)

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      setEditAmount('')
      return
    }
    const numericValue = value.replace(/\D/g, '')
    setEditAmount(formatCurrencyMask(numericValue))
  }

  const handleSubmit = async (formData: FormData) => {
    setErrorMsg(null)
    formData.set('id', transaction.id)
    formData.set('type', editType)
    formData.set('amount', parseCurrency(editAmount).toString())
    formData.set('category', editCategory)
    formData.set('description', editDescription)
    if (editDate) {
      formData.set('record_date', editDate.toISOString().split('T')[0])
    }

    const result = await updateTransaction(formData)
    if (result?.error) {
      setErrorMsg(result.error)
      return
    }
    onOpenChange(false)
  }

  const handleDelete = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id)
      if (result?.error) {
        setErrorMsg(result.error)
        setConfirmDelete(false)
        return
      }
      onOpenChange(false)
    })
  }

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={mode === 'edit' ? 'Editar Transação' : 'Detalhes da Transação'}
    >
      {mode === 'view' ? (
        <div className="space-y-5">
          {/* Header card with amount */}
          <div
            className={cn(
              'rounded-lg border bg-card p-4',
              transaction.isCogs
                ? 'border-l-4 border-l-amber-500'
                : isIncome
                  ? 'border-l-4 border-l-emerald-500'
                  : 'border-l-4 border-l-red-500'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={cn('h-6 w-6 shrink-0', accentClasses)} />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base leading-snug break-words">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {transaction.isCogs ? 'Custo de Mercadoria Vendida (CMV)' : isIncome ? 'Receita' : 'Despesa'}
                  </p>
                </div>
              </div>
              <span className={cn('font-bold text-lg sm:text-xl whitespace-nowrap', accentClasses)}>
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Metadata grid */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Field icon={Tag} label="Categoria">
              <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium">
                {transaction.category}
              </span>
              {transaction.isCogs && (
                <span className="ml-2 inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-medium">
                  CMV
                </span>
              )}
            </Field>
            <Field icon={CalendarDays} label="Data">
              {formattedDate}
            </Field>
            <Field icon={CreditCard} label="Forma de pagamento">
              {transaction.paymentMethodName || (
                <span className="text-muted-foreground">—</span>
              )}
            </Field>
            <Field icon={LinkIcon} label="Origem">
              {transaction.source === 'appointment' ? 'Agendamento' : transaction.stockMovementId ? 'Venda de produto' : 'Manual'}
            </Field>
          </dl>

          {isLocked && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              Esta transação foi gerada automaticamente (venda, comissão ou custo). Edição e exclusão estão desabilitadas para preservar a integridade do estoque e dos relatórios.
            </div>
          )}

          {errorMsg && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Fechar
            </Button>
            {!isLocked && (
              <>
                {confirmDelete ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isPending}
                      className="w-full sm:w-auto"
                    >
                      <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isPending}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isPending ? 'Excluindo...' : 'Confirmar exclusão'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                    <Button onClick={() => setMode('edit')} className="w-full sm:w-auto">
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Tipo</span>
            <Select value={editType} onValueChange={(v) => setEditType(v as 'income' | 'expense')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Categoria</span>
            <Select value={editCategory} onValueChange={setEditCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {editableCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Descrição</span>
            <Input
              name="description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Descrição"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Valor</span>
            <Input
              name="amount"
              value={editAmount}
              onChange={handleAmountChange}
              type="text"
              inputMode="numeric"
              placeholder="R$ 0,00"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Data</span>
            <DatePicker value={editDate} onChange={setEditDate} />
          </div>

          {errorMsg && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode('view')}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <SubmitButton pendingText="Salvando...">Salvar alterações</SubmitButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof FileText
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

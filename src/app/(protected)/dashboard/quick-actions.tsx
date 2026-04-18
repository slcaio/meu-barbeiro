'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { CalendarPlus, TrendingDown, TrendingUp } from 'lucide-react'

const CreateAppointmentDialog = dynamic(() =>
  import('../appointments/create-appointment-dialog').then((mod) => mod.CreateAppointmentDialog)
)
const AddTransactionDialog = dynamic(() =>
  import('../financial/add-transaction-dialog').then((mod) => mod.AddTransactionDialog)
)
const StockSaleDialog = dynamic(() =>
  import('../stock/stock-sale-dialog').then((mod) => mod.StockSaleDialog)
)
import type { ServiceOption, BarberOption, Product, PaymentMethodWithInstallments } from '@/types/database.types'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
}

interface QuickActionsProps {
  services: ServiceOption[]
  clients: Client[]
  barbers: BarberOption[]
  categories: Category[]
  products: Product[]
  paymentMethods: PaymentMethodWithInstallments[]
}

export function QuickActions({ services, clients, barbers, categories, products, paymentMethods }: QuickActionsProps) {
  const [appointmentOpen, setAppointmentOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [incomeOpen, setIncomeOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="w-full justify-start"
        variant="outline"
        onClick={() => setAppointmentOpen(true)}
      >
        <CalendarPlus className="mr-2 h-4 w-4 text-blue-600" />
        Novo Agendamento
      </Button>

      <Button
        className="w-full justify-start"
        variant="outline"
        onClick={() => setExpenseOpen(true)}
      >
        <TrendingDown className="mr-2 h-4 w-4 text-red-600" />
        Registrar Despesa
      </Button>

      <Button
        className="w-full justify-start"
        variant="outline"
        onClick={() => setIncomeOpen(true)}
      >
        <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
        Registrar Receita
      </Button>

      <StockSaleDialog
        products={products}
        paymentMethods={paymentMethods}
        barbers={barbers}
        variant="button"
      />

      <CreateAppointmentDialog
        services={services}
        clients={clients}
        barbers={barbers}
        isOpen={appointmentOpen}
        onOpenChange={setAppointmentOpen}
      />

      <AddTransactionDialog
        categories={categories}
        isOpen={expenseOpen}
        onOpenChange={setExpenseOpen}
        initialType="expense"
      />

      <AddTransactionDialog
        categories={categories}
        isOpen={incomeOpen}
        onOpenChange={setIncomeOpen}
        initialType="income"
      />
    </div>
  )
}

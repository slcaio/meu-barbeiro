import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentMethodList } from './payment-method-list'

export default async function PaymentMethodsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) redirect('/setup/wizard')

  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('*, payment_method_installments(installment_number, fee_percentage)')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Métodos de Pagamento</h1>
        <p className="text-muted-foreground">
          Gerencie os métodos de pagamento e suas taxas.
        </p>
      </div>

      <PaymentMethodList paymentMethods={paymentMethods || []} />
    </div>
  )
}

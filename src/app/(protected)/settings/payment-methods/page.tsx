import { getPaymentMethodsWithInstallments } from '@/app/payment-methods/actions'
import { PaymentMethodList } from './payment-method-list'

export default async function PaymentMethodsPage() {
  const paymentMethods = await getPaymentMethodsWithInstallments()

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

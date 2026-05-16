# Feature: Métodos de Pagamento com Taxas Customizáveis

## Status: Implementado ✅

## Resumo
Ao concluir um agendamento, é obrigatório selecionar um método de pagamento previamente cadastrado.
Cada método pode ter uma taxa customizável (percentual ou fixa) que é registrada como despesa no financeiro.

## Tabela: payment_methods
- `id`, `barbershop_id`, `name`, `fee_type` (percentage|fixed), `fee_value`, `is_active`

## Arquivos criados
- `supabase/migrations/20260409000000_create_payment_methods_table.sql`
- `src/app/payment-methods/actions.ts` (CRUD: get, create, update, delete)
- `src/app/(protected)/settings/payment-methods/page.tsx`
- `src/app/(protected)/settings/payment-methods/payment-method-list.tsx`
- `src/app/(protected)/settings/payment-methods/create-payment-method-dialog.tsx`
- `src/app/(protected)/settings/payment-methods/edit-payment-method-dialog.tsx`

## Arquivos modificados
- `src/types/database.types.ts` — nova tabela + `payment_method_id` em appointments e financial_records
- `src/app/(protected)/settings/page.tsx` — card "Métodos de Pagamento"
- `src/app/setup/actions.ts` — métodos padrão no setup (Dinheiro, Pix, Crédito 3%, Débito 1.5%)
- `src/app/(protected)/appointments/page.tsx` — busca payment methods ativos
- `src/app/(protected)/appointments/appointments-calendar-view.tsx` — repassa paymentMethods
- `src/app/(protected)/appointments/appointment-details-dialog.tsx` — repassa paymentMethods
- `src/app/(protected)/appointments/appointment-pos-dialog.tsx` — select obrigatório + cálculo de taxa
- `src/app/appointments/actions.ts` — registra payment_method_id e cria despesa de taxa
- `src/app/(protected)/financial/page.tsx` — join com payment_methods
- `src/app/(protected)/financial/transaction-list.tsx` — badge com nome do método

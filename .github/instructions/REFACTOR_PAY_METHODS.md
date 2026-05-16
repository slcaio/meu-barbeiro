# Refactor: Parcelamento com Taxas por Parcela em Métodos de Pagamento

## TL;DR
Refatorar o sistema de métodos de pagamento para suportar parcelamento com taxas individuais por número de parcelas. Em vez de criar um método de pagamento separado para cada quantidade de parcelas (ex: "Crédito 2x", "Crédito 3x"), agora um único método com `supports_installments = true` pode ter taxas de 2x até 12x configuradas individualmente. A taxa existente (`fee_type`/`fee_value`) passa a representar a taxa à vista (1x).

---

## Motivação

Anteriormente, para registrar taxas diferentes por quantidade de parcelas no cartão de crédito, era necessário criar um método de pagamento para cada variação (ex: "Cartão 2x — 5%", "Cartão 3x — 7%"). Isso era trabalhoso, poluía a lista e dificultava a seleção no POS. Com esta refatoração, um único "Cartão de Crédito" pode ter todas as taxas de parcelamento configuradas internamente.

---

## Decisões de Design

| Decisão | Escolha |
|---|---|
| Quais métodos podem ter parcelamento? | Apenas os marcados com `supports_installments = true` |
| Máximo de parcelas | 12x (CHECK constraint no banco) |
| Como configurar taxas por parcela? | Uma a uma, com input individual para cada parcela (2x-12x) |
| O que é armazenado no appointment? | `payment_method_id` + `installments` (número de parcelas) |
| O que acontece com `fee_type`/`fee_value` original? | Continua sendo a taxa à vista (1x) — backward compatible |
| Estratégia de update das parcelas | Replace: deleta todas as existentes e reinsere |

---

## Fase 1: Banco de Dados

### Migration: `20260410000001_add_installments_to_payment_methods.sql`

**Alterações:**
1. `ALTER TABLE payment_methods ADD COLUMN supports_installments BOOLEAN NOT NULL DEFAULT FALSE`
2. Nova tabela `payment_method_installments`:
   - `id` UUID PK
   - `payment_method_id` UUID FK → payment_methods(id) ON DELETE CASCADE
   - `installment_number` INTEGER CHECK (2-12)
   - `fee_percentage` DECIMAL(5,2) NOT NULL
   - UNIQUE(payment_method_id, installment_number)
3. `ALTER TABLE appointments ADD COLUMN installments INTEGER NOT NULL DEFAULT 1`
4. RLS policies na nova tabela (4 policies: SELECT, INSERT, UPDATE, DELETE via JOIN)
5. Índice em `payment_method_id`

---

## Fase 2: Tipos TypeScript

### `src/types/database.types.ts`

- Adicionado `supports_installments: boolean` em `payment_methods` (Row/Insert/Update)
- Adicionada tabela `payment_method_installments` completa
- Adicionado `installments: number` em `appointments` (Row/Insert/Update)
- Novos type aliases:
  - `PaymentMethodInstallment` — Row type da tabela
  - `PaymentMethodWithInstallments` — extends `PaymentMethodOption` com `supports_installments` e array de `payment_method_installments`

---

## Fase 3: Server Actions

### `src/app/payment-methods/actions.ts`

- Schema Zod atualizado com `supports_installments` (coerce boolean)
- Novos schemas: `installmentEntrySchema` e `installmentsArraySchema`
- `createPaymentMethod`:
  - Agora faz `.insert().select('id').single()` para obter o ID do novo método
  - Se `supports_installments = true`, parseia `installments_json` do FormData e insere em `payment_method_installments`
- `updatePaymentMethod`:
  - Após atualizar o método, deleta todas as installments existentes
  - Se `supports_installments = true`, reinsere novas installments do `installments_json`
- Revalida `/settings/payment-methods` e `/appointments`

### `src/app/appointments/actions.ts`

- `completeAppointmentWithTransaction` recebe `installments` do FormData (default 1)
- Salva `installments` no update do appointment
- Cálculo de taxa:
  - Se `installments > 1 && supports_installments`: consulta `payment_method_installments` para a parcela específica, usa `fee_percentage`
  - Se `installments = 1` ou sem suporte: usa `fee_type`/`fee_value` existente (backward compatible)
- Descrição da taxa inclui info de parcelamento (ex: "Taxa Cartão Crédito 3x - 7%")

### `src/app/setup/actions.ts`

- "Cartão de Crédito" padrão criado com `supports_installments: true` (sem taxas pré-configuradas)

---

## Fase 4: UI — Configurações

### Create Dialog (`create-payment-method-dialog.tsx`)

- Novo checkbox "Aceita parcelamento (até 12x)"
- Quando ativado, exibe grid de 11 inputs (2x até 12x) para taxa percentual por parcela
- Label do campo de taxa existente muda para "Taxa à Vista (1x)"
- Serializa installments como JSON no campo `installments_json` do FormData

### Edit Dialog (`edit-payment-method-dialog.tsx`)

- Mesma UI do Create, pré-preenchida com dados existentes
- `useEffect` carrega taxas de parcelas existentes nos inputs

### Payment Method List (`payment-method-list.tsx`)

- Badge azul "Até Nx" para métodos com parcelamento (N = maior parcela configurada)
- Descrição mostra "• Até Nx" como sufixo

### Page (`page.tsx`)

- Query alterada para incluir JOIN: `.select('*, payment_method_installments(installment_number, fee_percentage)')`

---

## Fase 5: UI — Agendamentos

### Appointments Page (`page.tsx`)

- Query de payment methods alterada para incluir `supports_installments` e `payment_method_installments`

### POS Dialog (`appointment-pos-dialog.tsx`)

- Usa tipo `PaymentMethodWithInstallments[]`
- Novo state `selectedInstallments` (default 1)
- Quando método com `supports_installments = true` é selecionado, exibe dropdown com opções:
  - "1x de R$ X,XX (à vista)" — usa taxa base
  - "2x de R$ X,XX (taxa Y%)" — para cada parcela configurada
- Cálculo de taxa dinâmico baseado na parcela selecionada
- Envia `installments` no FormData

### Props Cascade

- Componentes `appointment-list.tsx`, `appointment-details-dialog.tsx`, `appointments-calendar-view.tsx` atualizados para usar `PaymentMethodWithInstallments` em vez de `PaymentMethodOption`

---

## Fase 6: Testes

### `src/app/payment-methods/actions.test.ts`

- Mock chain do `createPaymentMethod` atualizado para `.insert().select().single()` retornando `{data: {id}, error}`
- Mock chain do `updatePaymentMethod` atualizado para incluir delete de installments após update
- Novos testes:
  - "cria método com parcelamento e taxas por parcela" — verifica insert em `payment_method_installments`
  - "atualiza método com parcelamento e substitui taxas" — verifica delete + reinsert

### `src/app/appointments/actions.test.ts`

- Mocks de payment_methods atualizados com campo `supports_installments`
- Novo teste: "completa agendamento com parcelamento e taxa por parcela" — verifica query em `payment_method_installments` e registro de taxa correta

---

## Arquivos Modificados

| Arquivo | Tipo de Mudança |
|---|---|
| `supabase/migrations/20260410000001_add_installments_to_payment_methods.sql` | **Criado** |
| `src/types/database.types.ts` | Modificado |
| `src/app/payment-methods/actions.ts` | Modificado |
| `src/app/payment-methods/actions.test.ts` | Modificado |
| `src/app/appointments/actions.ts` | Modificado |
| `src/app/appointments/actions.test.ts` | Modificado |
| `src/app/setup/actions.ts` | Modificado |
| `src/app/(protected)/settings/payment-methods/create-payment-method-dialog.tsx` | Modificado |
| `src/app/(protected)/settings/payment-methods/edit-payment-method-dialog.tsx` | Modificado |
| `src/app/(protected)/settings/payment-methods/payment-method-list.tsx` | Modificado |
| `src/app/(protected)/settings/payment-methods/page.tsx` | Modificado |
| `src/app/(protected)/appointments/page.tsx` | Modificado |
| `src/app/(protected)/appointments/appointment-pos-dialog.tsx` | Modificado |
| `src/app/(protected)/appointments/appointment-details-dialog.tsx` | Modificado |
| `src/app/(protected)/appointments/appointment-list.tsx` | Modificado |
| `src/app/(protected)/appointments/appointments-calendar-view.tsx` | Modificado |

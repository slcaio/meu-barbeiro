# Plano: Métodos de Pagamento com Taxas Customizáveis

## TL;DR
Implementar um sistema de métodos de pagamento cadastráveis nas configurações, com taxas customizáveis por método, obrigatório na confirmação de serviço (POS dialog). Inclui nova tabela no banco, CRUD no painel de settings, integração no fluxo de conclusão de agendamento, e registro da taxa como despesa financeira.

---

## Fase 1: Banco de Dados

### Step 1 — Migration: Criar tabela `payment_methods`
- Criar `supabase/migrations/20260409000000_create_payment_methods_table.sql`
- Tabela `payment_methods`:
  - `id` UUID PK default gen_random_uuid()
  - `barbershop_id` UUID FK → barbershops(id) ON DELETE CASCADE
  - `name` VARCHAR(100) NOT NULL (ex: "Dinheiro", "Cartão Crédito", "Pix")
  - `fee_type` VARCHAR(10) CHECK ('percentage' | 'fixed') — tipo da taxa
  - `fee_value` DECIMAL(10,2) DEFAULT 0 — valor da taxa (% ou R$)
  - `is_active` BOOLEAN DEFAULT TRUE
  - `created_at` TIMESTAMP DEFAULT now()
  - `updated_at` TIMESTAMP DEFAULT now()
- Índices: `(barbershop_id)`, `(barbershop_id, is_active)`
- RLS policies seguindo padrão de barbers (owner CRUD, baseado em barbershop_id → user_id)
- Trigger para auto-update `updated_at`

### Step 2 — Migration: Adicionar `payment_method_id` em `appointments`
- Na mesma migration ou separada
- `ALTER TABLE appointments ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id)`
- Nullable para não quebrar registros existentes

### Step 3 — Migration: Adicionar `payment_method_id` em `financial_records`
- `ALTER TABLE financial_records ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id)`
- Nullable para manter retrocompatibilidade

### Step 4 — Atualizar tipos TypeScript
- Atualizar `src/types/database.types.ts` com a nova tabela `payment_methods` e os novos campos em `appointments` e `financial_records`

---

## Fase 2: CRUD de Métodos de Pagamento (Settings)

### Step 5 — Server Actions **(paralelo com Step 6)**
- Criar `src/app/payment-methods/actions.ts`
- Funções seguindo padrão de `barbers/actions.ts`:
  - `getPaymentMethods()` — lista por barbershop_id
  - `createPaymentMethod(formData)` — Zod validation (name min 2, fee_type, fee_value ≥ 0)
  - `updatePaymentMethod(formData)` — edita nome, taxa, is_active
  - `deletePaymentMethod(id)` — soft delete ou hard delete
- Schema Zod: `{ name, fee_type, fee_value, is_active }`
- Revalidar: `/settings/payment-methods`, `/appointments`

### Step 6 — Página de Configuração de Métodos de Pagamento **(paralelo com Step 5)**
- Criar `src/app/(protected)/settings/payment-methods/page.tsx` — server component, busca payment methods
- Criar `src/app/(protected)/settings/payment-methods/payment-method-list.tsx` — client component, lista com badges de taxa
- Criar `src/app/(protected)/settings/payment-methods/create-payment-method-dialog.tsx` — modal criar
- Criar `src/app/(protected)/settings/payment-methods/edit-payment-method-dialog.tsx` — modal editar
- **Template**: seguir exatamente o padrão de `settings/barbers/` (barber-list, create-barber-dialog, edit-barber-dialog)
- Campos no form: Nome, Tipo de Taxa (% ou R$ fixo), Valor da Taxa, Ativo (toggle)
- Na lista: mostrar badge com taxa formatada (ex: "3.5%" ou "R$ 2,00")

### Step 7 — Adicionar card no hub de Settings
- Editar `src/app/(protected)/settings/page.tsx`
- Adicionar novo card "Métodos de Pagamento" com ícone CreditCard do lucide-react, link para `/settings/payment-methods`

### Step 8 — Métodos padrão no Setup Wizard **(paralelo com Steps 6-7)**
- Editar `src/app/setup/actions.ts`
- Após criar a barbershop, inserir automaticamente 4 métodos padrão:
  - Dinheiro (fee_type: 'percentage', fee_value: 0)
  - Pix (fee_type: 'percentage', fee_value: 0)
  - Cartão de Crédito (fee_type: 'percentage', fee_value: 3)
  - Cartão de Débito (fee_type: 'percentage', fee_value: 1.5)

---

## Fase 3: Integração no Fluxo de Pagamento

### Step 9 — Atualizar POS Dialog **(depende de Steps 4, 5)**
- Editar `src/app/(protected)/appointments/appointment-pos-dialog.tsx`
- Receber lista de `paymentMethods` como prop (buscar no page.tsx pai)
- Adicionar campo obrigatório `<Select>` para selecionar método de pagamento (somente métodos ativos)
- Ao selecionar, calcular e exibir taxa em tempo real:
  - Se percentage: `amount * (fee_value / 100)`
  - Se fixed: `fee_value`
- Mostrar resumo: "Valor do Serviço: R$ 50,00 | Taxa (Crédito 3%): R$ 1,50 | Total: R$ 51,50" (ou opção: taxa deduzida do valor)
- Enviar `payment_method_id` no formData
- Remover hardcoded `payment_method: 'money'`

### Step 10 — Atualizar Appointments Page
- Editar `src/app/(protected)/appointments/page.tsx`
- Buscar `payment_methods` ativos junto com os outros dados
- Passar como prop para o fluxo AppointmentDetailsDialog → AppointmentPOSDialog

### Step 11 — Atualizar Server Action `completeAppointmentWithTransaction` **(depende de Steps 2, 3)**
- Editar `src/app/appointments/actions.ts`
- Receber `payment_method_id` do formData
- Validar que o payment_method_id existe e pertence à barbershop
- Salvar `payment_method_id` no appointment
- Salvar `payment_method_id` nos financial_records criados
- Calcular taxa do método de pagamento:
  - Buscar payment_method pelo id
  - Calcular valor da taxa
  - Se taxa > 0: criar registro adicional em `financial_records` com type='expense', category='Taxa de Pagamento', amount=taxa calculada, payment_method_id
- Revalidar paths normalmente

---

## Fase 4: Visibilidade nos Relatórios

### Step 12 — Exibir método de pagamento nas transações **(após Step 11)**
- Editar `src/app/(protected)/financial/transaction-list.tsx` — mostrar badge com nome do método
- Editar `src/app/(protected)/financial/financial-filters.tsx` — adicionar filtro por método de pagamento (opcional, nice-to-have)

---

## Arquivos Relevantes

### Criar:
- `supabase/migrations/20260409000000_create_payment_methods_table.sql` — migration completa
- `src/app/payment-methods/actions.ts` — server actions CRUD
- `src/app/(protected)/settings/payment-methods/page.tsx` — page server component
- `src/app/(protected)/settings/payment-methods/payment-method-list.tsx` — lista client component
- `src/app/(protected)/settings/payment-methods/create-payment-method-dialog.tsx` — dialog criar
- `src/app/(protected)/settings/payment-methods/edit-payment-method-dialog.tsx` — dialog editar

### Modificar:
- `src/types/database.types.ts` — adicionar tipos da nova tabela + campos novos
- `src/app/(protected)/settings/page.tsx` — adicionar card "Métodos de Pagamento"
- `src/app/(protected)/appointments/page.tsx` — buscar e passar payment methods
- `src/app/(protected)/appointments/appointment-pos-dialog.tsx` — select obrigatório + cálculo de taxa
- `src/app/(protected)/appointments/appointment-details-dialog.tsx` — passar payment methods adiante
- `src/app/appointments/actions.ts` — receber payment_method_id, calcular taxa, criar registro
- `src/app/(protected)/financial/transaction-list.tsx` — exibir método na lista

### Referência/Template:
- `src/app/(protected)/settings/barbers/` — padrão completo de CRUD settings (barber-list, create-barber-dialog, edit-barber-dialog)
- `src/app/barbers/actions.ts` — padrão de server actions com Zod + revalidation

---

## Verificação

1. **Migration**: Aplicar migration e verificar tabela criada com `supabase db reset` ou migration push
2. **CRUD**: Criar, editar, ativar/desativar e deletar métodos de pagamento em `/settings/payment-methods`
3. **POS Dialog**: Confirmar que select é obrigatório — não permite submit sem selecionar método
4. **Cálculo de Taxa**: Validar cálculo correto para taxa percentual e fixa
5. **Financial Records**: Verificar que taxa é registrada como despesa separada em `/financial`
6. **Retrocompatibilidade**: Agendamentos antigos (sem método) ainda funcionam normalmente
7. **Testes**: Criar testes para server actions (payment-methods/actions.test.ts, appointments/actions.test.ts atualizado)
8. **RLS**: Verificar que um usuário não vê/edita methods de outra barbearia

---

## Decisões

- **Taxa é deduzida ou adicionada?**: Receita registrada como valor cheio do serviço. Taxa registrada como despesa separada (category='Taxa de Pagamento'). O lucro líquido no financeiro já reflete a dedução automaticamente (receita - despesas). Isso mantém auditabilidade e o registro da taxa fica visível.
- **Métodos padrão**: Ao criar barbearia (setup wizard), criar automaticamente: Dinheiro (0%), Pix (0%), Cartão de Crédito (3%), Cartão de Débito (1.5%).
- **Soft delete vs Hard delete**: payment_methods usados em appointments não devem ser deletados fisicamente. Usar `is_active = false` para desativar, e ON DELETE SET NULL como fallback.
- **Escopo incluído**: CRUD de métodos, integração no POS, registro de taxas, exibição no financeiro, métodos padrão no setup.
- **Escopo excluído**: Relatório específico de taxas por método, edição de método em transações passadas.

# 💈 FEATURE: Gestão de Barbeiros (Team Members)

## 1. VISÃO GERAL

Adicionar suporte a **múltiplos barbeiros** trabalhando em uma mesma barbearia. O proprietário (owner) poderá cadastrar barbeiros, atribuí-los a agendamentos, visualizar métricas individuais e gerenciar suas disponibilidades.

> **Contexto**: Atualmente o sistema é single-barber — o `user_id` em `appointments` referencia o owner. Esta feature introduz a entidade `barbers` desacoplada de `auth.users`, permitindo que o owner cadastre barbeiros sem que eles precisem ter conta no sistema.

---

## 2. MODELO DE DADOS

### 2.1 Nova Tabela: `barbers`

```sql
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'barber' NOT NULL,
  -- CHECK (role IN ('barber', 'senior_barber', 'trainee'))
  avatar_url TEXT,
  commission_percentage DECIMAL(5,2) DEFAULT 0,
  -- Porcentagem de comissão (0-100) sobre serviços realizados
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_barbers_barbershop_id ON public.barbers(barbershop_id);
CREATE INDEX idx_barbers_is_active ON public.barbers(barbershop_id, is_active);
```

### 2.2 Alteração na Tabela `appointments`

```sql
-- Adicionar coluna barber_id (nullable para retrocompatibilidade)
ALTER TABLE public.appointments
  ADD COLUMN barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL;

CREATE INDEX idx_appointments_barber_id ON public.appointments(barber_id);
```

### 2.3 Nova Tabela (Opcional Fase 2): `barber_services`

Relacionamento N:N entre barbeiros e serviços que cada um sabe executar.

```sql
CREATE TABLE public.barber_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(barber_id, service_id)
);
```

### 2.4 RLS Policies para `barbers`

```sql
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- Owner pode ver seus barbeiros
CREATE POLICY "Owner can view barbers"
  ON public.barbers FOR SELECT
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

-- Owner pode criar barbeiros
CREATE POLICY "Owner can insert barbers"
  ON public.barbers FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

-- Owner pode atualizar barbeiros
CREATE POLICY "Owner can update barbers"
  ON public.barbers FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

-- Owner pode deletar barbeiros
CREATE POLICY "Owner can delete barbers"
  ON public.barbers FOR DELETE
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

-- Grants
GRANT ALL ON public.barbers TO authenticated;
GRANT SELECT ON public.barbers TO anon;
```

### 2.5 Atualização do `database.types.ts`

Adicionar a tipagem da nova tabela:

```typescript
barbers: {
  Row: {
    id: string
    barbershop_id: string
    name: string
    phone: string | null
    email: string | null
    role: string
    avatar_url: string | null
    commission_percentage: number
    is_active: boolean
    notes: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    barbershop_id: string
    name: string
    phone?: string | null
    email?: string | null
    role?: string
    avatar_url?: string | null
    commission_percentage?: number
    is_active?: boolean
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    barbershop_id?: string
    name?: string
    phone?: string | null
    email?: string | null
    role?: string
    avatar_url?: string | null
    commission_percentage?: number
    is_active?: boolean
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "barbers_barbershop_id_fkey"
      columns: ["barbershop_id"]
      referencedRelation: "barbershops"
      referencedColumns: ["id"]
    }
  ]
}
```

Atualizar `appointments` para incluir:

```typescript
// Adicionar ao Row, Insert e Update de appointments:
barber_id: string | null  // Row
barber_id?: string | null  // Insert e Update
// Adicionar ao Relationships de appointments:
{
  foreignKeyName: "appointments_barber_id_fkey"
  columns: ["barber_id"]
  referencedRelation: "barbers"
  referencedColumns: ["id"]
}
```

---

## 3. MIGRATION SQL COMPLETA

Criar arquivo: `supabase/migrations/YYYYMMDDHHMMSS_create_barbers_table.sql`

```sql
-- ============================================
-- Migration: Criar tabela barbers e relacionar com appointments
-- ============================================

-- 1. Criar tabela barbers
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'barber' NOT NULL CHECK (role IN ('barber', 'senior_barber', 'trainee')),
  avatar_url TEXT,
  commission_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Índices
CREATE INDEX idx_barbers_barbershop_id ON public.barbers(barbershop_id);
CREATE INDEX idx_barbers_active ON public.barbers(barbershop_id, is_active);

-- 3. Adicionar barber_id nos appointments
ALTER TABLE public.appointments
  ADD COLUMN barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL;

CREATE INDEX idx_appointments_barber_id ON public.appointments(barber_id);

-- 4. RLS
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view barbers"
  ON public.barbers FOR SELECT
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert barbers"
  ON public.barbers FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update barbers"
  ON public.barbers FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can delete barbers"
  ON public.barbers FOR DELETE
  USING (
    barbershop_id IN (
      SELECT id FROM public.barbershops WHERE user_id = auth.uid()
    )
  );

-- 5. Grants
GRANT ALL ON public.barbers TO authenticated;
GRANT SELECT ON public.barbers TO anon;

-- 6. Trigger para updated_at
CREATE TRIGGER update_barbers_updated_at
  BEFORE UPDATE ON public.barbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 4. ESTRUTURA DE ARQUIVOS

### 4.1 Novos Arquivos

```
src/
├── app/
│   ├── barbers/
│   │   └── actions.ts                          # Server Actions (CRUD barbeiros)
│   └── (protected)/
│       └── settings/
│           └── barbers/
│               ├── page.tsx                     # Página de gestão de barbeiros
│               ├── barber-list.tsx              # Lista/tabela de barbeiros
│               ├── create-barber-dialog.tsx     # Modal criar barbeiro
│               └── edit-barber-dialog.tsx       # Modal editar barbeiro
supabase/
└── migrations/
    └── YYYYMMDDHHMMSS_create_barbers_table.sql # Migration
```

### 4.2 Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/database.types.ts` | Adicionar tipagem `barbers` + `barber_id` em appointments |
| `src/app/appointments/actions.ts` | Aceitar `barber_id` no `createAppointment` |
| `src/app/(protected)/appointments/create-appointment-dialog.tsx` | Adicionar dropdown de barbeiro |
| `src/app/(protected)/appointments/appointment-details-dialog.tsx` | Exibir nome do barbeiro |
| `src/app/(protected)/appointments/appointments-calendar-view.tsx` | Filtro por barbeiro + cor por barbeiro |
| `src/app/(protected)/appointments/appointment-pos-dialog.tsx` | Considerar comissão do barbeiro |
| `src/app/(protected)/dashboard/page.tsx` | Métricas por barbeiro (opcional) |
| `src/app/(protected)/settings/page.tsx` | Adicionar card de navegação "Barbeiros" |
| `src/app/(protected)/layout.tsx` | Considerar link direto "Equipe" no menu (opcional) |

---

## 5. SERVER ACTIONS — `src/app/barbers/actions.ts`

### 5.1 `getBarbers()`

```typescript
'use server'

export async function getBarbers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!barbershop) throw new Error('Barbearia não encontrada')

  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name')

  if (error) throw error
  return data
}
```

### 5.2 `createBarber(formData)`

**Validação Zod**:
```typescript
const barberSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  role: z.enum(['barber', 'senior_barber', 'trainee']).default('barber'),
  commission_percentage: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional().or(z.literal('')),
})
```

**Fluxo**:
1. Validar campos com Zod
2. Buscar `barbershop_id` do owner
3. Inserir em `barbers`
4. `revalidatePath('/settings/barbers')`
5. Retornar `{ success: true }`

### 5.3 `updateBarber(formData)`

**Validação Zod**:
```typescript
const updateBarberSchema = barberSchema.extend({
  id: z.string().uuid(),
  is_active: z.coerce.boolean().default(true),
})
```

**Fluxo**:
1. Validar campos
2. Verificar que barbeiro pertence à barbearia do owner
3. Atualizar em `barbers`
4. `revalidatePath('/settings/barbers')`
5. Retornar `{ success: true }`

### 5.4 `deleteBarber(barberId)`

**Fluxo**:
1. Verificar que barbeiro pertence à barbearia do owner
2. Hard delete (appointments com `barber_id` ficam `NULL` via `ON DELETE SET NULL`)
3. `revalidatePath('/settings/barbers')`
4. Retornar `{ success: true }`

### 5.5 `getBarberStats(barberId)`

Métricas individuais do barbeiro:

```typescript
export async function getBarberStats(barberId: string) {
  // Total de atendimentos completados
  // Receita gerada (sum total_amount WHERE status='completed')
  // Atendimentos no mês atual
  // Comissão calculada = receita * (commission_percentage / 100)
}
```

---

## 6. COMPONENTES UI

### 6.1 Página de Barbeiros — `settings/barbers/page.tsx`

**Server Component** que:
1. Busca barbeiros via `getBarbers()`
2. Redireciona a `/setup/wizard` se não tem barbearia
3. Renderiza layout com:
   - Header "Equipe" + botão "Novo Barbeiro"
   - `BarberList` com todos os barbeiros
   - `CreateBarberDialog` controlado por estado

### 6.2 `barber-list.tsx`

**Client Component** — Tabela/cards com:

| Coluna | Descrição |
|--------|-----------|
| Avatar | Inicial do nome (circle colorido) |
| Nome | Nome completo |
| Telefone | Formatado com `formatPhone()` |
| Função | Badge: Barbeiro / Sênior / Aprendiz |
| Comissão | Porcentagem (ex: 40%) |
| Status | Badge Ativo/Inativo |
| Ações | Editar / Desativar / Excluir |

**Funcionalidades**:
- Busca por nome
- Toggle ativo/inativo rápido
- Confirmação antes de excluir
- Abrir `EditBarberDialog` ao clicar em Editar

### 6.3 `create-barber-dialog.tsx`

**Client Component** — Modal com formulário:

| Campo | Tipo | Validação |
|-------|------|-----------|
| Nome* | text | min 2 caracteres |
| Telefone | tel | formatPhone mask |
| Email | email | email válido |
| Função | select | barber / senior_barber / trainee |
| Comissão (%) | number | 0-100 |
| Observações | textarea | opcional |

- Usa `useActionState` com `createBarber`
- Feedback de loading via `useTransition`
- Fecha modal e limpa form ao sucesso

### 6.4 `edit-barber-dialog.tsx`

**Client Component** — Similar ao create, mas:
- Pré-preenchido com dados do barbeiro
- Toggle de ativo/inativo
- Chama `updateBarber`

---

## 7. INTEGRAÇÃO COM AGENDAMENTOS

### 7.1 Modificação em `createAppointment`

Adicionar campo opcional `barber_id` ao schema Zod e à inserção:

```typescript
const appointmentSchema = z.object({
  // ... campos existentes ...
  barber_id: z.string().uuid().optional().or(z.literal('')),
})

// No insert:
.insert({
  // ... campos existentes ...
  barber_id: validated.barber_id || null,
})
```

### 7.2 Modificação em `create-appointment-dialog.tsx`

Adicionar **dropdown de Barbeiro** entre o serviço e a data:

```tsx
<div>
  <Label htmlFor="barber_id">Barbeiro</Label>
  <Select name="barber_id" value={barberId} onValueChange={setBarberId}>
    <SelectTrigger>
      <SelectValue placeholder="Selecionar barbeiro (opcional)" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">Sem barbeiro específico</SelectItem>
      {barbers.filter(b => b.is_active).map(barber => (
        <SelectItem key={barber.id} value={barber.id}>
          {barber.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

- Prop `barbers` vem da page pai (server-fetched)
- Campo é **opcional** — agendamento pode existir sem barbeiro atribuído

### 7.3 Modificação em `appointment-details-dialog.tsx`

Exibir nome do barbeiro nos detalhes:

```tsx
{appointment.barber && (
  <div>
    <span className="text-muted-foreground">Barbeiro:</span>
    <span>{appointment.barber.name}</span>
  </div>
)}
```

### 7.4 Modificação no Calendário

**Filtro por Barbeiro**:
- Adicionar `<Select>` na toolbar do calendário para filtrar eventos por `barber_id`
- Opção "Todos" mostra todos os agendamentos

**Cores por Barbeiro** (opcional):
- Ao filtrar, cada barbeiro pode ter cor distinta
- Array de cores predefinidas atribuídas por índice do barbeiro

### 7.5 Query de Appointments com Join

Atualizar queries de appointments para incluir o barbeiro:

```typescript
const { data } = await supabase
  .from('appointments')
  .select('*, services(*), barbers(*)')
  .eq('barbershop_id', barbershop.id)
  .order('appointment_date')
```

---

## 8. INTEGRAÇÃO COM FINANCEIRO

### 8.1 Comissão na Conclusão de Agendamento

Ao completar um agendamento via POS (`completeAppointmentWithTransaction`):

```typescript
// Se o appointment tem barber_id e o barbeiro tem commission_percentage > 0:
if (appointment.barber_id) {
  const { data: barber } = await supabase
    .from('barbers')
    .select('commission_percentage, name')
    .eq('id', appointment.barber_id)
    .single()

  if (barber && barber.commission_percentage > 0) {
    const commissionAmount = amount * (barber.commission_percentage / 100)
    
    // Registrar comissão como despesa
    await supabase.from('financial_records').insert({
      barbershop_id: barbershop.id,
      type: 'expense',
      amount: commissionAmount,
      category: 'Comissão',
      description: `Comissão ${barber.name} - ${barber.commission_percentage}%`,
      record_date: new Date().toISOString().split('T')[0],
    })
  }
}
```

### 8.2 Nova Categoria Financeira

Adicionar **"Comissão"** às categorias de despesa existentes:

```typescript
// Categorias de Despesa (atualizar onde estiver definido)
const expenseCategories = [
  'Aluguel', 'Contas', 'Impostos', 'Produtos',
  'Salário', 'Manutenção', 'Marketing', 'Comissão', 'Outros'
]
```

---

## 9. INTEGRAÇÃO COM DASHBOARD

### 9.1 Novo Card: "Barbeiros Ativos"

Substituir o placeholder "Clientes Ativos" ou adicionar novo card:

```typescript
// Query
const { count: activeBarbers } = await supabase
  .from('barbers')
  .select('*', { count: 'exact', head: true })
  .eq('barbershop_id', barbershop.id)
  .eq('is_active', true)
```

### 9.2 Próximos Agendamentos — Exibir Barbeiro

Na lista de próximos agendamentos, exibir o nome do barbeiro ao lado do serviço:

```tsx
<p className="text-sm text-muted-foreground">
  {appointment.services.name}
  {appointment.barbers && ` • ${appointment.barbers.name}`}
</p>
```

---

## 10. INTEGRAÇÃO COM SETTINGS

### 10.1 Atualizar `settings/page.tsx`

Adicionar card de navegação para Barbeiros:

```tsx
<Link href="/settings/barbers">
  <Card className="hover:shadow-md transition-shadow cursor-pointer">
    <CardHeader>
      <Users className="h-8 w-8 text-primary" />
      <CardTitle>Equipe</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Gerencie os barbeiros da sua barbearia
      </p>
    </CardContent>
  </Card>
</Link>
```

---

## 11. FASES DE IMPLEMENTAÇÃO

### Fase 1 — MVP (Prioridade Alta)

1. **Migration SQL** — Criar tabela `barbers` + alterar `appointments`
2. **Types** — Atualizar `database.types.ts`
3. **Server Actions** — CRUD completo de barbeiros (`barbers/actions.ts`)
4. **UI de Gestão** — Página `/settings/barbers` com lista, criar e editar
5. **Integração Appointments** — Dropdown de barbeiro no `create-appointment-dialog`
6. **Settings** — Card de navegação "Equipe"

### Fase 2 — Melhorias (Prioridade Média)

7. **Detalhes do Appointment** — Exibir barbeiro no `appointment-details-dialog`
8. **Filtro no Calendário** — Filtrar agendamentos por barbeiro
9. **Comissão Automática** — Registrar comissão ao completar agendamento
10. **Dashboard** — Card de barbeiros ativos + nome no próximo agendamento

### Fase 3 — Avançado (Prioridade Baixa)

11. **Tabela `barber_services`** — N:N barbeiros ↔ serviços
12. **Filtrar serviços por barbeiro** — No dialog de agendamento, só mostrar serviços que o barbeiro selecionado sabe fazer
13. **Relatório Individual** — Página com métricas e histórico por barbeiro
14. **Disponibilidade por Barbeiro** — Horários de trabalho individuais (JSONB `working_hours`)
15. **Cores no Calendário** — Cada barbeiro com cor distinta nos eventos

---

## 12. VALIDAÇÕES E REGRAS DE NEGÓCIO

| Regra | Descrição |
|-------|-----------|
| Barbeiro pertence à barbearia | Todas as operações verificam `barbershop_id` via RLS e server action |
| Nome obrigatório | Mínimo 2 caracteres |
| Comissão 0-100% | Constraint no banco + validação Zod |
| Roles fixos | `barber`, `senior_barber`, `trainee` — CHECK constraint |
| Delete cascata | Deletar barbeiro → appointments ficam com `barber_id = NULL` |
| Barbeiro inativo | Não aparece no dropdown de agendamentos, mas mantém histórico |
| Sem login obrigatório | Barbeiros NÃO precisam ter conta `auth.users` — são cadastrados pelo owner |
| Campo opcional | `barber_id` em appointments é nullable — agendamento funciona sem barbeiro |

---

## 13. TESTES E VALIDAÇÃO

### Cenários a Verificar

- [ ] Criar barbeiro com dados mínimos (só nome)
- [ ] Criar barbeiro com todos os campos
- [ ] Editar barbeiro (nome, telefone, comissão, role)
- [ ] Desativar barbeiro — não aparece no dropdown de agendamento
- [ ] Reativar barbeiro — volta a aparecer
- [ ] Excluir barbeiro — appointments existentes ficam sem barbeiro (NULL)
- [ ] Criar agendamento COM barbeiro selecionado
- [ ] Criar agendamento SEM barbeiro (campo vazio)
- [ ] Completar agendamento com barbeiro que tem comissão → financial_record criado
- [ ] Completar agendamento com barbeiro sem comissão → sem registro extra
- [ ] Filtrar calendário por barbeiro
- [ ] Dashboard exibe contagem de barbeiros ativos
- [ ] RLS: usuário A não consegue ver barbeiros do usuário B

---

## 14. EXEMPLO DE USO

```
Fluxo do Owner:

1. Owner acessa Configurações → Equipe
2. Clica "Novo Barbeiro"
3. Preenche: Nome="Carlos", Função="Barbeiro", Comissão=40%
4. Salva → Carlos aparece na lista

5. Owner abre Agenda → "Novo Agendamento"
6. Seleciona cliente, serviço "Corte" (R$30), barbeiro "Carlos"
7. Define data/hora → Cria agendamento

8. Ao completar o agendamento:
   - Receita: R$30 (income, categoria "Serviço")
   - Comissão: R$12 (expense, categoria "Comissão", 40% de R$30)
   - Lucro líquido do serviço: R$18

9. No financeiro, owner vê ambos os registros
```

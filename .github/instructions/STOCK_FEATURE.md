# Feature: Controle de Estoque

## 1. Visão Geral

O módulo de **Estoque** permite que o proprietário da barbearia gerencie produtos (vendáveis e/ou de uso interno), controle entradas e saídas, e mantenha integração bidirecional com o módulo financeiro.

### Contexto de negócio

Barbearias vendem produtos como pomadas, shampoos, pentes e lâminas. Também compram insumos que precisam ser rastreados. Atualmente não existe controle — tudo é lançado manualmente no financeiro sem vínculo com estoque real.

### Resumo das Fases

| Fase | Escopo |
|------|--------|
| **Fase 1 — MVP** | Migration, Types, CRUD de Produtos, Entrada/Saída manual, Sidebar, Testes |
| **Fase 2 — Integração Financeira** | Venda com registro automático de receita, Liquidação de entradas pendentes, Integração no `add-transaction-dialog`, Badge no `transaction-list`, Alerta de estoque baixo no dashboard |
| **Fase 3 — Melhorias Futuras** | Integração com agendamentos (produtos consumidos por serviço), Relatórios, Histórico de preços, Importação CSV, SKU/Código de barras |

### Decisões de design

- **Navegação**: Top-level na sidebar (ícone `Package`), entre Financeiro e Configurações
- **Venda de produtos**: Tanto pela página `/stock` quanto pelo dialog de transação no `/financial`
- **Entrada de estoque**: **NÃO** gera despesa automática — cria lançamento com status `pending` que o owner liquida manualmente depois, gerando a despesa no financeiro
- **Integração com agendamentos**: Excluída do escopo atual
- **Alertas de estoque mínimo**: Sim, com `min_stock` configurável por produto

---

## 2. Modelo de Dados

### 2.1 Tabela `products`

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `barbershop_id` | UUID | FK → barbershops, NOT NULL | Multi-tenant |
| `name` | VARCHAR(100) | NOT NULL | Nome do produto |
| `description` | TEXT | nullable | Descrição opcional |
| `cost_price` | DECIMAL(10,2) | NOT NULL, default 0 | Preço de custo |
| `sale_price` | DECIMAL(10,2) | NOT NULL | Preço de venda |
| `current_stock` | INTEGER | NOT NULL, default 0 | Estoque atual (controlado por movimentações) |
| `min_stock` | INTEGER | NOT NULL, default 0 | Estoque mínimo (alerta) |
| `unit` | VARCHAR(10) | NOT NULL, default 'un' | Unidade: `un`, `ml`, `g`, `kg`, `L` |
| `is_active` | BOOLEAN | NOT NULL, default true | Soft delete |
| `created_at` | TIMESTAMPTZ | default `now()` | |
| `updated_at` | TIMESTAMPTZ | default `now()` | Trigger |

**Índices**:
- `idx_products_barbershop_id` em `(barbershop_id)`
- `idx_products_barbershop_active` em `(barbershop_id, is_active)`

**Unique constraint**: `uq_products_barbershop_name` em `(barbershop_id, name)`

**RLS policies** (via `barbershops.user_id = auth.uid()`):
- SELECT, INSERT, UPDATE, DELETE — owner-only

---

### 2.2 Tabela `stock_movements`

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `product_id` | UUID | FK → products, NOT NULL | |
| `barbershop_id` | UUID | FK → barbershops, NOT NULL | Multi-tenant |
| `type` | VARCHAR(20) | NOT NULL, CHECK `IN ('entry','exit','adjustment')` | |
| `quantity` | INTEGER | NOT NULL, CHECK `> 0` | |
| `unit_cost` | DECIMAL(10,2) | nullable | Custo unitário no momento |
| `total_cost` | DECIMAL(10,2) | nullable | `quantity × unit_cost` |
| `source` | VARCHAR(20) | NOT NULL, CHECK `IN ('manual','sale','purchase','adjustment')` | Origem da movimentação |
| `reference_id` | UUID | nullable, FK → financial_records | Vínculo com financial_records (quando liquidado) |
| `financial_status` | VARCHAR(20) | NOT NULL, default 'none', CHECK `IN ('none','pending','settled')` | Status financeiro da movimentação |
| `notes` | TEXT | nullable | Observações |
| `created_at` | TIMESTAMPTZ | default `now()` | |

**Índices**:
- `idx_stock_movements_barbershop_id` em `(barbershop_id)`
- `idx_stock_movements_product_id` em `(product_id)`
- `idx_stock_movements_pending` em `(barbershop_id, financial_status)` WHERE `financial_status = 'pending'`

**RLS policies**: owner-only (mesmo padrão)

---

### 2.3 Alterações em `financial_records`

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| `stock_movement_id` | UUID | nullable, FK → stock_movements | Rastreabilidade bidirecional |

---

## 3. Migration SQL

**Arquivo**: `supabase/migrations/20260414120000_create_stock_tables.sql`

```sql
-- ============================================================
-- STOCK MODULE — Products + Stock Movements
-- ============================================================

-- 1. Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(10) NOT NULL DEFAULT 'un',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_products_barbershop_name UNIQUE (barbershop_id, name),
  CONSTRAINT chk_products_sale_price CHECK (sale_price >= 0),
  CONSTRAINT chk_products_cost_price CHECK (cost_price >= 0),
  CONSTRAINT chk_products_min_stock CHECK (min_stock >= 0),
  CONSTRAINT chk_products_unit CHECK (unit IN ('un', 'ml', 'g', 'kg', 'L'))
);

-- Indexes
CREATE INDEX idx_products_barbershop_id ON products(barbershop_id);
CREATE INDEX idx_products_barbershop_active ON products(barbershop_id, is_active);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own products"
  ON products FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can insert own products"
  ON products FOR INSERT
  WITH CHECK (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can update own products"
  ON products FOR UPDATE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can delete own products"
  ON products FOR DELETE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

-- Grants
GRANT ALL ON products TO authenticated;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- ============================================================
-- 2. Create stock_movements table
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  source VARCHAR(20) NOT NULL,
  reference_id UUID REFERENCES financial_records(id) ON DELETE SET NULL,
  financial_status VARCHAR(20) NOT NULL DEFAULT 'none',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_movement_type CHECK (type IN ('entry', 'exit', 'adjustment')),
  CONSTRAINT chk_movement_quantity CHECK (quantity > 0),
  CONSTRAINT chk_movement_source CHECK (source IN ('manual', 'sale', 'purchase', 'adjustment')),
  CONSTRAINT chk_movement_financial_status CHECK (financial_status IN ('none', 'pending', 'settled'))
);

-- Indexes
CREATE INDEX idx_stock_movements_barbershop_id ON stock_movements(barbershop_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_pending ON stock_movements(barbershop_id, financial_status)
  WHERE financial_status = 'pending';

-- RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own movements"
  ON stock_movements FOR SELECT
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can insert own movements"
  ON stock_movements FOR INSERT
  WITH CHECK (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can update own movements"
  ON stock_movements FOR UPDATE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owner can delete own movements"
  ON stock_movements FOR DELETE
  USING (barbershop_id IN (
    SELECT id FROM barbershops WHERE user_id = auth.uid()
  ));

GRANT ALL ON stock_movements TO authenticated;

-- ============================================================
-- 3. Add stock_movement_id to financial_records
-- ============================================================

ALTER TABLE financial_records
  ADD COLUMN IF NOT EXISTS stock_movement_id UUID
  REFERENCES stock_movements(id) ON DELETE SET NULL;
```

---

## 4. Atualização de Types

**Arquivo**: `src/types/database.types.ts`

Adicionar dentro de `Tables`:

```typescript
products: {
  Row: {
    id: string
    barbershop_id: string
    name: string
    description: string | null
    cost_price: number
    sale_price: number
    current_stock: number
    min_stock: number
    unit: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    barbershop_id: string
    name: string
    description?: string | null
    cost_price?: number
    sale_price: number
    current_stock?: number
    min_stock?: number
    unit?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    barbershop_id?: string
    name?: string
    description?: string | null
    cost_price?: number
    sale_price?: number
    current_stock?: number
    min_stock?: number
    unit?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "products_barbershop_id_fkey"
      columns: ["barbershop_id"]
      referencedRelation: "barbershops"
      referencedColumns: ["id"]
    }
  ]
}
stock_movements: {
  Row: {
    id: string
    product_id: string
    barbershop_id: string
    type: 'entry' | 'exit' | 'adjustment'
    quantity: number
    unit_cost: number | null
    total_cost: number | null
    source: 'manual' | 'sale' | 'purchase' | 'adjustment'
    reference_id: string | null
    financial_status: 'none' | 'pending' | 'settled'
    notes: string | null
    created_at: string
  }
  Insert: {
    id?: string
    product_id: string
    barbershop_id: string
    type: 'entry' | 'exit' | 'adjustment'
    quantity: number
    unit_cost?: number | null
    total_cost?: number | null
    source: 'manual' | 'sale' | 'purchase' | 'adjustment'
    reference_id?: string | null
    financial_status?: 'none' | 'pending' | 'settled'
    notes?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    product_id?: string
    barbershop_id?: string
    type?: 'entry' | 'exit' | 'adjustment'
    quantity?: number
    unit_cost?: number | null
    total_cost?: number | null
    source?: 'manual' | 'sale' | 'purchase' | 'adjustment'
    reference_id?: string | null
    financial_status?: 'none' | 'pending' | 'settled'
    notes?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "stock_movements_product_id_fkey"
      columns: ["product_id"]
      referencedRelation: "products"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "stock_movements_barbershop_id_fkey"
      columns: ["barbershop_id"]
      referencedRelation: "barbershops"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "stock_movements_reference_id_fkey"
      columns: ["reference_id"]
      referencedRelation: "financial_records"
      referencedColumns: ["id"]
    }
  ]
}
```

Em `financial_records`, adicionar:

```typescript
// Row
stock_movement_id: string | null

// Insert
stock_movement_id?: string | null

// Update
stock_movement_id?: string | null

// Relationships (adicionar)
{
  foreignKeyName: "financial_records_stock_movement_id_fkey"
  columns: ["stock_movement_id"]
  referencedRelation: "stock_movements"
  referencedColumns: ["id"]
}
```

Adicionar convenience aliases ao final do arquivo:

```typescript
export type Product = Database['public']['Tables']['products']['Row']
export type StockMovement = Database['public']['Tables']['stock_movements']['Row']
```

---

## 5. Estrutura de Arquivos

### Novos

```
src/app/stock/
├── actions.ts              # Server Actions
└── actions.test.ts         # Testes

src/app/(protected)/stock/
├── page.tsx                # Página principal (Server Component)
├── product-list.tsx        # Lista + busca (Client Component)
├── create-product-dialog.tsx
├── edit-product-dialog.tsx
├── stock-entry-dialog.tsx  # Registrar entrada (compra)
├── stock-sale-dialog.tsx   # Registrar venda (saída)
├── pending-entries-section.tsx
└── stock-history-dialog.tsx

supabase/migrations/
└── 20260414120000_create_stock_tables.sql
```

### Modificados

```
src/types/database.types.ts          # Novas tabelas + stock_movement_id em financial_records
src/app/(protected)/layout.tsx       # Link "Estoque" na sidebar
src/app/(protected)/financial/
├── add-transaction-dialog.tsx       # Toggle "Venda de produto?"
├── transaction-list.tsx             # Badge "Estoque"
└── page.tsx                         # Passar products como prop
src/app/(protected)/dashboard/page.tsx  # Card de alerta estoque baixo
```

---

## 6. Server Actions

**Arquivo**: `src/app/stock/actions.ts`

Todas seguem o padrão obrigatório: auth → Zod → barbershop → DB → revalidate → return.

### 6.1 `getProducts()`

```typescript
export async function getProducts() {
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
    .from('products')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}
```

### 6.2 `createProduct(formData)`

```typescript
const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional().or(z.literal('')),
  cost_price: z.coerce.number().min(0, 'Preço de custo deve ser ≥ 0'),
  sale_price: z.coerce.number().min(0.01, 'Preço de venda deve ser positivo'),
  initial_stock: z.coerce.number().int().min(0).default(0),
  min_stock: z.coerce.number().int().min(0).default(0),
  unit: z.enum(['un', 'ml', 'g', 'kg', 'L']).default('un'),
})

export async function createProduct(formData: FormData) {
  // 1. Auth check
  // 2. Zod validation
  // 3. Fetch barbershop
  // 4. Insert product (current_stock = initial_stock)
  // 5. If initial_stock > 0: create stock_movement (entry, source: manual, financial_status: none)
  // 6. revalidatePath('/stock')
  // 7. Return { success }
}
```

### 6.3 `updateProduct(formData)`

```typescript
const updateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional().or(z.literal('')),
  cost_price: z.coerce.number().min(0),
  sale_price: z.coerce.number().min(0.01),
  min_stock: z.coerce.number().int().min(0),
  unit: z.enum(['un', 'ml', 'g', 'kg', 'L']),
})

export async function updateProduct(formData: FormData) {
  // NÃO atualiza current_stock — controlado por movimentações
  // 1-6: padrão
}
```

### 6.4 `deleteProduct(productId)`

```typescript
export async function deleteProduct(productId: string) {
  // 1. Auth check
  // 2. Check if product has stock_movements
  //    - Sim: soft delete (is_active = false)
  //    - Não: hard delete
  // 3. revalidatePath('/stock')
}
```

### 6.5 `registerStockEntry(formData)`

> Registra entrada de produtos (compra/reposição). NÃO gera despesa automaticamente.

```typescript
const stockEntrySchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1, 'Quantidade deve ser ≥ 1'),
  unit_cost: z.coerce.number().min(0, 'Custo unitário deve ser ≥ 0'),
  notes: z.string().optional().or(z.literal('')),
})

export async function registerStockEntry(formData: FormData) {
  // 1. Auth → Zod → barbershop
  // 2. Validate product exists and belongs to barbershop
  // 3. Insert stock_movement:
  //    type: 'entry', source: 'purchase'
  //    financial_status: 'pending' (aguardando liquidação)
  //    total_cost: quantity × unit_cost
  // 4. Increment stock (atômico):
  //    UPDATE products SET current_stock = current_stock + $quantity
  // 5. revalidatePath('/stock')
  // Return { success }
}
```

### 6.6 `registerStockSale(formData)`

> Registra venda de produto. Cria saída no estoque + receita no financeiro automaticamente.

```typescript
const stockSaleSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1),
  unit_price: z.coerce.number().min(0.01),
  payment_method_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export async function registerStockSale(formData: FormData) {
  // 1. Auth → Zod → barbershop
  // 2. Fetch product → validate current_stock >= quantity
  //    Se insuficiente: return { error: 'Estoque insuficiente. Disponível: X un.' }
  // 3. Insert stock_movement:
  //    type: 'exit', source: 'sale', financial_status: 'none'
  // 4. Decrement stock (atômico):
  //    UPDATE products SET current_stock = current_stock - $quantity
  // 5. Create financial_record:
  //    type: 'income', category: 'Produto'
  //    amount: quantity × unit_price
  //    description: 'Venda: {product.name} x{quantity}'
  //    stock_movement_id: movement.id
  //    payment_method_id: se informado
  // 6. Update stock_movement.reference_id = financial_record.id
  // 7. revalidatePath('/stock'), revalidatePath('/financial'), revalidatePath('/dashboard')
  // Return { success }
}
```

### 6.7 `settleStockEntry(movementId)`

> Liquida uma entrada pendente — cria despesa no financeiro.

```typescript
export async function settleStockEntry(movementId: string) {
  // 1. Auth → barbershop
  // 2. Fetch stock_movement WHERE id = movementId AND financial_status = 'pending'
  //    Se não encontrada: return { error: 'Movimentação não encontrada ou já liquidada.' }
  // 3. Fetch product name for description
  // 4. Create financial_record:
  //    type: 'expense', category: 'Produtos'
  //    amount: movement.total_cost
  //    description: 'Compra: {product.name} x{quantity}'
  //    stock_movement_id: movement.id
  // 5. Update stock_movement:
  //    financial_status: 'settled'
  //    reference_id: financial_record.id
  // 6. revalidatePath('/stock'), revalidatePath('/financial')
  // Return { success }
}
```

### 6.8 `getPendingEntries()`

```typescript
export async function getPendingEntries() {
  // Fetch stock_movements WHERE financial_status = 'pending'
  // JOIN products ON product_id = products.id (para pegar nome)
  // ORDER BY created_at DESC
}
```

### 6.9 `getLowStockProducts()`

```typescript
export async function getLowStockProducts() {
  // Opção RPC com filter: WHERE current_stock < min_stock AND min_stock > 0 AND is_active = true
  // Ou fetch no server e filtrar em JS (simples):
  const products = await getProducts()
  return products.filter(p => p.min_stock > 0 && p.current_stock < p.min_stock)
}
```

### 6.10 `adjustStock(formData)`

> Ajuste manual de estoque (inventário/correção).

```typescript
const adjustStockSchema = z.object({
  product_id: z.string().uuid(),
  new_quantity: z.coerce.number().int().min(0, 'Quantidade não pode ser negativa'),
  notes: z.string().min(3, 'Motivo do ajuste é obrigatório'),
})

export async function adjustStock(formData: FormData) {
  // 1. Auth → Zod → barbershop
  // 2. Fetch product → calcular diff = new_quantity - current_stock
  //    Se diff == 0: return { error: 'Estoque já está neste valor.' }
  // 3. Insert stock_movement:
  //    type: 'adjustment', source: 'adjustment'
  //    quantity: Math.abs(diff)
  //    financial_status: 'none'
  //    notes: obrigatório (motivo)
  // 4. Update product: current_stock = new_quantity
  // 5. revalidatePath('/stock')
}
```

### 6.11 `getStockMovements(productId)`

```typescript
export async function getStockMovements(productId: string) {
  // Fetch stock_movements WHERE product_id = productId
  // ORDER BY created_at DESC
  // JOIN products (para validar ownership via barbershop_id)
}
```

---

## 7. Componentes UI

### 7.1 `page.tsx` — Página Principal (Server Component)

```
Estrutura:
├── Page Header ("Estoque")
│   └── Botões: "Novo Produto", "Registrar Entrada", "Registrar Venda"
├── KPI Cards (grid 1/2/4 cols)
│   ├── Total Produtos (Package icon, blue)
│   ├── Estoque Baixo (AlertTriangle icon, red) — count de current_stock < min_stock
│   ├── Entradas Pendentes (Clock icon, amber) — count de financial_status='pending'
│   └── Valor em Estoque (DollarSign icon, emerald) — Σ(cost_price × current_stock)
├── ProductList (client component com busca)
└── PendingEntriesSection (colapsável)
```

```typescript
// Server Component pattern
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProducts, getPendingEntries } from '@/app/stock/actions'
import { ProductList } from './product-list'
import { PendingEntriesSection } from './pending-entries-section'
// ... icons, cards, dialogs

export default async function StockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const products = await getProducts()
  const pendingEntries = await getPendingEntries()

  const lowStockCount = products.filter(p => p.min_stock > 0 && p.current_stock < p.min_stock).length
  const totalStockValue = products.reduce((sum, p) => sum + (p.cost_price * p.current_stock), 0)

  return (
    // ... render KPIs + ProductList + PendingEntriesSection
  )
}
```

### 7.2 `product-list.tsx` — Lista de Produtos (Client Component)

```
Estrutura:
├── Search Input (busca client-side por nome)
├── Tabela
│   ├── Colunas: Nome | Custo | Preço Venda | Estoque | Mín. | Unidade | Ações
│   ├── Badge vermelho se current_stock < min_stock
│   ├── Badge amarelo se current_stock < min_stock × 1.5
│   └── Ações: Editar | Histórico | Venda Rápida
└── Empty state se sem produtos
```

**Props**:
```typescript
interface ProductListProps {
  products: Product[]
  paymentMethods?: PaymentMethod[] // Para o stock-sale-dialog
}
```

### 7.3 `create-product-dialog.tsx`

**Campos do form**:
- Nome (input text, min 2)
- Descrição (input text, opcional)
- Preço de Custo (input com `formatCurrency()`)
- Preço de Venda (input com `formatCurrency()`)
- Estoque Inicial (input number, ≥ 0)
- Estoque Mínimo (input number, ≥ 0)
- Unidade (select: un, ml, g, kg, L)

**Action**: `createProduct(formData)`

### 7.4 `edit-product-dialog.tsx`

Mesmo que create, **sem campo de estoque** (controlado por movimentações). Campos:
- Nome, Descrição, Preço de Custo, Preço de Venda, Estoque Mínimo, Unidade

**Action**: `updateProduct(formData)` — inclui campo hidden `id`

### 7.5 `stock-entry-dialog.tsx`

**Campos**:
- Produto (Select com lista de produtos ativos)
- Quantidade (input number, ≥ 1)
- Custo Unitário (input com `formatCurrency()`)
- Total (computed: quantidade × custo unitário, readonly)
- Observações (textarea, opcional)

**Action**: `registerStockEntry(formData)`

### 7.6 `stock-sale-dialog.tsx`

**Campos**:
- Produto (Select, mostra `nome (estoque: X un)`)
- Quantidade (input number, ≤ estoque disponível)
- Preço Unitário (input com `formatCurrency()`, default = `sale_price`)
- Total (computed: quantidade × preço unitário, readonly)
- Método de Pagamento (Select, opcional)
- Observações (textarea, opcional)

**Action**: `registerStockSale(formData)`

**Validação client-side**: quantidade ≤ product.current_stock

### 7.7 `pending-entries-section.tsx`

```
Estrutura:
├── Header: "Entradas Pendentes" + badge count
├── Lista (colapsável)
│   └── Card por entrada:
│       ├── Produto nome | Qtd × Custo Unit. = Total
│       ├── Data da entrada
│       └── Botão "Liquidar" (confirma e chama settleStockEntry)
└── Empty state se sem pendentes
```

### 7.8 `stock-history-dialog.tsx`

**Trigger**: Botão "Histórico" na tabela de produtos.

**Conteúdo**:
- Produto nome + estoque atual no header
- Timeline de movimentações (newest first):
  - Badge tipo: Entrada (green), Saída (red), Ajuste (blue)
  - Quantidade + custo (se disponível)
  - Source label: Compra, Venda, Manual, Ajuste
  - Financial status badge: Pendente (amber), Liquidado (green), N/A (gray)
  - Data + notas

---

## 8. Integração com Sidebar

**Arquivo**: `src/app/(protected)/layout.tsx`

Adicionar ao array `navigation`, entre "Financeiro" e "Configurações":

```typescript
import { Package } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agenda', href: '/appointments', icon: Calendar },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Estoque', href: '/stock', icon: Package },       // ← NOVO
  { name: 'Configurações', href: '/settings', icon: Settings },
]
```

---

## 9. Integração com Financeiro

### 9.1 `add-transaction-dialog.tsx`

Quando o tipo selecionado for `income`:
1. Exibir checkbox/toggle "Venda de produto?"
2. Se ativado:
   - Mostrar `<Select>` com produtos ativos (prop `products`)
   - Campo "Quantidade" (validação ≤ estoque)
   - Preço unitário pré-preenchido com `sale_price` (editável)
   - Total calculado automaticamente
3. Ao submeter: chamar `registerStockSale()` ao invés de `createTransaction()`

**Props adicionais**:
```typescript
interface AddTransactionDialogProps {
  // ... existentes
  products?: Product[] // Novos — para venda de produto
}
```

### 9.2 `transaction-list.tsx`

- Quando a transação tiver `stock_movement_id`:
  - Exibir badge `<Package className="h-3 w-3" /> Estoque` ao lado da categoria
  - Mantém comportamento existente (delete, etc.)

### 9.3 `statement-report-dialog.tsx`

- No CSV exportado, incluir coluna "Produto" quando `stock_movement_id` presente (opcional, pode ser adicionado em fase futura)

### 9.4 `financial/page.tsx`

- Importar `getProducts()` e buscar produtos
- Passar como prop para `AddTransactionDialog`:
  ```typescript
  const products = await getProducts()
  // ...
  <AddTransactionDialog products={products} />
  ```

---

## 10. Integração com Dashboard

**Arquivo**: `src/app/(protected)/dashboard/page.tsx`

Adicionar na seção de KPIs ou criar seção separada:

```typescript
import { Package, AlertTriangle } from 'lucide-react'
// ...

// Na query section, buscar produtos com estoque baixo:
const { data: lowStockProducts } = await supabase
  .from('products')
  .select('id, name, current_stock, min_stock')
  .eq('barbershop_id', barbershopId)
  .eq('is_active', true)
  .gt('min_stock', 0)

const lowStockCount = lowStockProducts?.filter(
  p => p.current_stock < p.min_stock
).length || 0

// Renderizar card de alerta se lowStockCount > 0:
{lowStockCount > 0 && (
  <Link href="/stock">
    <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Estoque Baixo</p>
            <p className="text-xs text-muted-foreground">
              {lowStockCount} produto(s) abaixo do mínimo
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
)}
```

---

## 11. Fases de Implementação

### Fase 1 — MVP

1. **Migration** `20260414120000_create_stock_tables.sql`
2. **Types** — Atualizar `database.types.ts`
3. **Server Actions** — CRUD de produtos (`getProducts`, `createProduct`, `updateProduct`, `deleteProduct`)
4. **Server Actions** — Entrada/saída: `registerStockEntry`, `registerStockSale`, `adjustStock`, `getStockMovements`
5. **UI** — `page.tsx`, `product-list.tsx`, `create-product-dialog.tsx`, `edit-product-dialog.tsx`
6. **UI** — `stock-entry-dialog.tsx`, `stock-sale-dialog.tsx`, `stock-history-dialog.tsx`
7. **Sidebar** — Adicionar link "Estoque"
8. **Testes** — `actions.test.ts`

### Fase 2 — Integração Financeira

1. **`settleStockEntry()`** — Liquidar entradas pendentes
2. **`pending-entries-section.tsx`** — UI para pendentes
3. **`add-transaction-dialog.tsx`** — Toggle "Venda de produto?"
4. **`transaction-list.tsx`** — Badge "Estoque"
5. **Dashboard** — Card de alerta estoque baixo
6. **`financial/page.tsx`** — Passar products como prop

### Fase 3 — Melhorias Futuras

1. Integração com agendamentos (produtos consumidos por serviço)
2. Relatório de movimentações por período
3. Histórico de preços (custo/venda)
4. Importação em massa (CSV)
5. SKU / Código de barras
6. Categorias de produtos

---

## 12. Dicas de Implementação

### Concorrência / Race Conditions

**Sempre use operações atômicas** para incrementar/decrementar estoque:

```typescript
// ✅ CORRETO — atômico
const { error } = await supabase.rpc('increment_stock', {
  p_product_id: productId,
  p_quantity: quantity,
})

// Ou via raw SQL com `.update()`:
// UPDATE products SET current_stock = current_stock + $1 WHERE id = $2
```

Como o Supabase JS não suporta `current_stock = current_stock + N` nativamente via `.update()`, a opção mais segura é criar uma **RPC function**:

```sql
-- Adicionar na migration
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET current_stock = current_stock + p_quantity,
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Uso no server action:
```typescript
await supabase.rpc('increment_stock', {
  p_product_id: productId,
  p_quantity: quantity, // positivo para entrada, negativo para saída
})
```

### Transação Atômica para Vendas

A operação de venda envolve: (1) criar stock_movement, (2) decrementar estoque, (3) criar financial_record, (4) vincular IDs.

**Opção A — RPC (recomendada)**: Criar function SQL que faz tudo numa transação.

**Opção B — Sequencial com rollback manual**: Executar em ordem e, se falhar, desfazer manualmente:
```typescript
// 1. Insert stock_movement
const { data: movement, error: mvError } = await supabase
  .from('stock_movements').insert({...}).select().single()
if (mvError) return { error: '...' }

// 2. Decrement stock
await supabase.rpc('increment_stock', { p_product_id: productId, p_quantity: -quantity })

// 3. Insert financial_record
const { data: record, error: finError } = await supabase
  .from('financial_records').insert({...}).select().single()
if (finError) {
  // Rollback: re-increment stock + delete movement
  await supabase.rpc('increment_stock', { p_product_id: productId, p_quantity: quantity })
  await supabase.from('stock_movements').delete().eq('id', movement.id)
  return { error: '...' }
}

// 4. Cross-link IDs
await supabase.from('stock_movements').update({ reference_id: record.id }).eq('id', movement.id)
```

### Validação Server-Side

**NUNCA confie no client** para validação de estoque:

```typescript
// ✅ SEMPRE re-fetch e validar no server
const { data: product } = await supabase
  .from('products').select('current_stock, name').eq('id', productId).single()

if (!product || product.current_stock < quantity) {
  return { error: `Estoque insuficiente. Disponível: ${product?.current_stock ?? 0} un.` }
}
```

### Pattern de Referência

- **CRUD + UI**: Seguir `BARBEIRO_FEATURE.md` — mesma estrutura de dialogs, list, page
- **Integração Financial**: Seguir `PAYMENT_METHOD_FEATURE.md` — padrão de como `completeAppointmentWithTransaction` registra receita + despesa
- **Categorias dinâmicas**: Usar as categorias "Produto" (income) e "Produtos" (expense) já criadas no seed

### Soft Delete

```typescript
// Verificar se produto tem movimentações
const { count } = await supabase
  .from('stock_movements')
  .select('*', { count: 'exact', head: true })
  .eq('product_id', productId)

if (count && count > 0) {
  // Soft delete
  await supabase.from('products').update({ is_active: false }).eq('id', productId)
} else {
  // Hard delete
  await supabase.from('products').delete().eq('id', productId)
}
```

---

## 13. Validações e Regras de Negócio

| Regra | Validação | Onde |
|-------|-----------|------|
| Nome único por barbearia | Unique constraint `(barbershop_id, name)` | DB + Zod |
| Estoque não pode ser negativo | CHECK constraint + validação server | DB + Server Action |
| Preço de venda ≥ 0.01 | CHECK constraint + Zod | DB + Server Action |
| Preço de custo ≥ 0 | CHECK constraint + Zod | DB + Server Action |
| Quantidade em movimentações > 0 | CHECK constraint + Zod | DB + Server Action |
| Apenas pendentes podem ser liquidados | Verificar `financial_status = 'pending'` | Server Action |
| Produto com movimentações → soft delete | Verificar count de stock_movements | Server Action |
| Ajuste requer motivo (notes) | Zod min(3) | Server Action |
| Tipo de movimentação válido | CHECK constraint | DB |
| Unidade válida | CHECK constraint + Zod | DB + Server Action |

---

## 14. Cenários de Teste

**Arquivo**: `src/app/stock/actions.test.ts`

### CRUD de Produtos
1. `getProducts` — retorna erro se não autenticado
2. `getProducts` — retorna lista de produtos
3. `createProduct` — retorna erro se não autenticado
4. `createProduct` — retorna erro com dados inválidos
5. `createProduct` — cria produto com sucesso
6. `updateProduct` — atualiza produto com sucesso
7. `deleteProduct` — soft delete quando tem movimentações
8. `deleteProduct` — hard delete quando não tem movimentações

### Movimentações de Estoque
9. `registerStockEntry` — registra entrada com sucesso (financial_status: pending)
10. `registerStockSale` — registra venda com sucesso + cria financial_record
11. `registerStockSale` — retorna erro com estoque insuficiente
12. `settleStockEntry` — liquida entrada com sucesso → cria despesa
13. `settleStockEntry` — retorna erro se já liquidada
14. `adjustStock` — ajusta estoque com sucesso
15. `adjustStock` — retorna erro sem notas

### Integração
16. Venda via add-transaction-dialog chama `registerStockSale` corretamente

---

## 15. Exemplo de Fluxo Completo

```
Owner cadastra "Pomada Modeladora" (custo: R$ 15, venda: R$ 35, mín: 5)
   ↓
Registra entrada: 20 unidades × R$ 15 = R$ 300
   → stock_movement (entry, pending, total_cost: 300)
   → product.current_stock: 0 → 20
   → SEM despesa no financeiro
   ↓
Vende 3 unidades × R$ 35 = R$ 105
   → stock_movement (exit, sale)
   → product.current_stock: 20 → 17
   → financial_record (income, R$ 105, "Venda: Pomada Modeladora x3")
   ↓
Vende mais 13 unidades → current_stock: 4 (< min_stock: 5)
   → Dashboard: "Estoque Baixo: 1 produto abaixo do mínimo"
   → Badge vermelho na tabela de estoque
   ↓
Owner liquida a entrada pendente
   → financial_record (expense, R$ 300, "Compra: Pomada Modeladora x20")
   → stock_movement.financial_status: pending → settled
   ↓
Owner cadastra nova entrada: 30 unidades × R$ 14 = R$ 420
   → current_stock: 4 → 34
   → Novo lançamento pendente de R$ 420
```

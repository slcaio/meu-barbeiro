# Plan: Categorias Customizáveis + Relatório de Extrato

## TL;DR
Criar tabela `categories` para categorias customizáveis (receita/despesa) por barbearia, com CRUD em Settings. Substituir categorias hardcoded nos filtros e dialogs pela busca dinâmica do banco. Adicionar modal de relatório de extrato (estilo commission-report-dialog) com exportação CSV das transações filtradas.

---

## Fase 1: Tabela e Server Actions de Categorias

### Step 1 — Migration: Criar tabela `categories`
- Criar `supabase/migrations/YYYYMMDD_create_categories_table.sql`
- Colunas: `id UUID PK`, `barbershop_id UUID FK`, `name VARCHAR(50)`, `type VARCHAR(10) CHECK IN ('income','expense')`, `created_at TIMESTAMP DEFAULT NOW()`
- RLS: "Users can manage categories from own barbershop" (mesma lógica de financial_records)
- Index em `barbershop_id`
- Unique constraint: `(barbershop_id, name, type)` para evitar duplicatas

### Step 2 — Atualizar `database.types.ts`
- Adicionar interface `categories` com Row, Insert, Update, Relationships

### Step 3 — Server Actions: `src/app/categories/actions.ts`
- `getCategories()`: retorna categorias da barbearia do usuário, ordenadas por name
- `createCategory(formData)`: valida name + type com Zod, insere
- `deleteCategory(id)`: deleta categoria (apenas custom, não impede se já usada)
- Revalida `/financial` e `/settings/categories`

### Step 4 — Seed categorias padrão no setup
- Em `src/app/setup/actions.ts` → `createBarbershop()`: após criar barbershop, inserir categorias default:
  - Income: Serviço, Produto, Outros
  - Expense: Aluguel, Contas (Água/Luz/Internet), Impostos, Produtos, Salário, Manutenção, Marketing, Comissão, Outros

---

## Fase 2: Tela de Categorias em Settings

### Step 5 — Página `src/app/(protected)/settings/categories/page.tsx`
- Server component: busca categorias via `getCategories()`
- Exibe lista dividida em 2 seções: "Receita" e "Despesa"
- Cada categoria: nome + botão delete (exceto padrão?)
- Componente `CreateCategoryDialog` para criar nova

### Step 6 — Componente lista: `src/app/(protected)/settings/categories/category-list.tsx`
- Client component com delete via `deleteCategory()`

### Step 7 — Dialog criação: `src/app/(protected)/settings/categories/create-category-dialog.tsx`
- Modal com: campo name + select type (income/expense)
- Chama `createCategory()`

### Step 8 — Registrar em Settings
- Em `src/app/(protected)/settings/page.tsx`: adicionar card "Categorias" com ícone `Tag` apontando para `/settings/categories`

---

## Fase 3: Integrar Categorias Dinâmicas no Financeiro

### Step 9 — Atualizar `financial-filters.tsx`
- Receber prop `categories` (passada pela page.tsx)
- Substituir categorias hardcoded pelo array dinâmico
- Manter opção "Todas"

### Step 10 — Atualizar `add-transaction-dialog.tsx`
- Receber prop `categories` (divididas por type)
- Substituir INCOME_CATEGORIES / EXPENSE_CATEGORIES pelas categorias do banco

### Step 11 — Atualizar `page.tsx` (financial)
- Buscar categorias via `getCategories()` 
- Passar como prop para `FinancialFilters` e `AddTransactionDialog`

---

## Fase 4: Modal de Relatório do Extrato

### Step 12 — Dialog: `src/app/(protected)/financial/statement-report-dialog.tsx`
- Client component, estilo similar a `commission-report-dialog.tsx`
- Recebe `transactions` e `summary` como props (dados já filtrados da page)
- Exibe no modal:
  - Cards resumo: Receita Total, Despesas, Lucro Líquido (mesmos da page)
  - Lista de transações do extrato filtrado
  - Botão "Exportar CSV"
- Função `exportCSV()`:
  - Gera CSV com colunas: Data, Tipo, Categoria, Descrição, Método de Pagamento, Valor
  - Trigger download via `Blob` + `URL.createObjectURL` + click link
  - Nome do arquivo: `extrato_YYYY-MM-DD.csv`

### Step 13 — Integrar na `page.tsx`
- Adicionar botão `StatementReportDialog` ao lado dos outros (Comissões, Receita, Despesa)
- Passar `transactions` e `summary` como props

---

## Fase 5: Testes

### Step 14 — Testes de server actions
- `src/app/categories/actions.test.ts`: testar getCategories, createCategory, deleteCategory
- `src/app/financial/actions.test.ts`: verificar se testes existentes continuam passando

### Step 15 — Verificação manual
- Conferir filtro de categoria carregando do banco
- Criar nova categoria em Settings e verificar no financeiro
- Gerar relatório de extrato e exportar CSV

---

## Arquivos Relevantes

**Novos:**
- `supabase/migrations/20260410000000_create_categories_table.sql` — migration
- `src/app/categories/actions.ts` — server actions (CRUD)
- `src/app/categories/actions.test.ts` — testes
- `src/app/(protected)/settings/categories/page.tsx` — página gerenciamento
- `src/app/(protected)/settings/categories/category-list.tsx` — lista 
- `src/app/(protected)/settings/categories/create-category-dialog.tsx` — dialog criação
- `src/app/(protected)/financial/statement-report-dialog.tsx` — modal relatório extrato

**Modificados:**
- `src/types/database.types.ts` — adicionar tipo `categories`
- `src/app/setup/actions.ts` — seed categorias padrão em `createBarbershop()`
- `src/app/(protected)/settings/page.tsx` — card "Categorias"
- `src/app/(protected)/financial/page.tsx` — buscar categorias, passar props, botão relatório
- `src/app/(protected)/financial/financial-filters.tsx` — categorias dinâmicas via prop
- `src/app/(protected)/financial/add-transaction-dialog.tsx` — categorias dinâmicas via prop

---

## Verificação

1. `npm run build` — sem erros de compilação
2. `npx vitest run` — testes passando (existentes + novos)
3. Manual: criar categoria "Transporte" (expense) em Settings → aparece no filtro do financeiro e no dialog de nova despesa
4. Manual: criar transação com categoria nova → filtrar por ela → gerar relatório → exportar CSV → abrir no Excel e validar dados

---

## Decisões
- **Tabela dedicada** para categorias (não derivar de DISTINCT)
- **Relatório de extrato** em modal com visualização + botão CSV (sem PDF)
- **Gerenciamento de categorias** em `/settings/categories` (sem inline no dialog de transação)
- **Categorias padrão** são seedadas no setup e podem ser deletadas pelo usuário
- **Unique constraint** `(barbershop_id, name, type)` previne duplicatas
- **Não há bloqueio** de deleção de categoria em uso — registros financeiros mantêm a string `category`

# 📅 FEATURE: Agenda com Bryntum Scheduler

## 1. VISÃO GERAL

Página de agendamentos que utiliza o **Bryntum Scheduler** (versão Trial 7.2.x) como componente de calendário. Cada barbeiro é representado como um **Resource** (linha) no scheduler, e cada agendamento é um **Event** (barra) posicionado no horário correspondente. O owner pode arrastar agendamentos entre horários e barbeiros, criar novos agendamentos via modal e visualizar detalhes/completar via modal POS.

> **Substituição**: O antigo `react-big-calendar` foi removido e todas as referências CSS (`.rbc-*`) foram eliminadas do `globals.css`.

---

## 2. DEPENDÊNCIAS

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `@bryntum/scheduler-trial` | ^7.2.3 | Core do Bryntum Scheduler (Trial) |
| `@bryntum/scheduler-react` | ^7.2.3 | React wrapper oficial |

### Configurações adicionais

- **`next.config.ts`**: `transpilePackages: ['@bryntum/scheduler', '@bryntum/scheduler-react']`
- **`src/types/bryntum.d.ts`**: Declaração de módulo para CSS imports (`@bryntum/scheduler/*.css`)

---

## 3. ESTRUTURA DE ARQUIVOS

```
src/
├── components/
│   └── bryntum/
│       └── scheduler-wrapper.tsx     # Wrapper SSR-safe para BryntumScheduler
├── app/
│   ├── (protected)/
│   │   └── appointments/
│   │       ├── page.tsx                      # Server Component (fetch dados)
│   │       ├── appointments-calendar-view.tsx # Client Component principal
│   │       ├── scheduler-config.ts           # Configuração estática do scheduler
│   │       ├── scheduler-theme.css           # Overrides CSS para integrar com design system
│   │       ├── create-appointment-dialog.tsx  # Modal de criação (inalterado)
│   │       └── appointment-details-dialog.tsx # Modal de detalhes/POS (inalterado)
│   └── appointments/
│       ├── actions.ts                        # Server Actions (updateAppointmentDate estendida)
│       └── actions.test.ts                   # Testes Vitest
└── types/
    └── bryntum.d.ts                          # Type declarations para CSS modules
```

---

## 4. ARQUITETURA

### 4.1 SSR-Safe Loading

Bryntum é uma lib client-only (acessa `window`/`document`). Para funcionar com Next.js App Router:

1. **`scheduler-wrapper.tsx`** — Componente simples que encapsula `<BryntumScheduler>` e aceita `schedulerRef`
2. **`dynamic import`** — No `appointments-calendar-view.tsx`:
   ```typescript
   const SchedulerWrapper = dynamic(
     () => import('@/components/bryntum/scheduler-wrapper'),
     { ssr: false, loading: () => <div>Carregando agenda...</div> }
   )
   ```

### 4.2 Theme System

O tema Bryntum acompanha o dark/light mode do app via `next-themes`:

```typescript
const { resolvedTheme } = useTheme()

useEffect(() => {
  const loadTheme = async () => {
    if (resolvedTheme === 'dark') {
      await import('@bryntum/scheduler/svalbard-dark.css')
    } else {
      await import('@bryntum/scheduler/svalbard-light.css')
    }
  }
  loadTheme()
}, [resolvedTheme])
```

- Tema base: **Svalbard** (light/dark)
- CSS overrides em `scheduler-theme.css` mapeiam variáveis CSS do Shadcn (`var(--card)`, `var(--border)`, etc.) para classes do Bryntum

### 4.3 Resources & Events

| Conceito Bryntum | Mapeamento no app |
|---|---|
| **Resource** | Barbeiro (`barbers` table). Cada barbeiro = 1 linha no scheduler |
| **Event** | Agendamento (`appointments` table). Duração baseada em `services.duration_minutes` |
| **Fallback Resource** | `__no-barber__` — linha "Sem barbeiro" para agendamentos sem barbeiro atribuído |

### 4.4 Configuração Estática

Definida em `scheduler-config.ts` **fora de componentes React** (Bryntum best practice para evitar re-renders):

- `rowHeight: 64`, `barMargin: 4`
- Features habilitadas: `eventDrag` (arrastar entre barbeiros), `stripe`, `columnLines`, `stickyEvents`
- Features desabilitadas: `eventResize`, `eventEdit`, `eventMenu`, `scheduleMenu`, menus de contexto, `eventDragCreate`
- Horário: 06:00–23:59 (`CALENDAR_START_HOUR` / `CALENDAR_END_HOUR`)

---

## 5. COMPONENTES

### 5.1 `AppointmentsCalendarView` (Client Component)

**Props**: `{ appointments, services, clients, barbers, paymentMethods }`

**State**:
- `viewMode` — `'day'` | `'week'`
- `date` — Data atual de navegação
- `isDialogOpen`, `isDetailsOpen` — Controle dos modals
- `selectedEvent` — Agendamento selecionado para o modal de detalhes
- `selectedDate` — Data clicada para criação

**useMemo**:
- `resources` — Transforma `barbers[]` em Resources do Bryntum (id, name, eventColor). Adiciona resource "Sem barbeiro" se necessário
- `events` — Transforma `appointments[]` em Events do Bryntum com campos customizados (appointmentData, clientName, serviceName, barberName, status, etc.)
- `timeSpan` — Calcula `startDate`/`endDate` baseado em `viewMode` + `date`
- `viewPreset` — Configura tick width e headers por modo de visualização

**Callbacks**:
- `handleScheduleClick` — Clique no grid vazio → abre `CreateAppointmentDialog` com data pré-selecionada
- `handleEventClick` — Clique em evento → abre `AppointmentDetailsDialog`
- `handleEventDrop` — Drag & drop de evento → chama `updateAppointmentDate(id, newDate, barberId?)`. Detecta mudança de barbeiro automaticamente
- `handleBeforeEventEdit` — Retorna `false` para bloquear editor nativo do Bryntum
- `eventRenderer` — JSX renderer: exibe horário, nome do cliente, serviço e barbeiro

**Toolbar** (React, não Bryntum `tbar`):
- Botões Anterior/Hoje/Próximo
- Label de data formatada em pt-BR
- Toggle Dia/Semana
- Botão de criar agendamento

**Legenda de cores**:
- Badges coloridos por barbeiro acima do scheduler
- 10 cores predefinidas em `BARBER_COLORS`

### 5.2 `SchedulerWrapper`

Wrapper fino que recebe `schedulerRef` como prop e repassa como `ref` para `<BryntumScheduler>`. Permite o uso de `dynamic()` com `ssr: false`.

---

## 6. SERVER ACTIONS

### 6.1 `updateAppointmentDate(id, newDate, barberId?)`

Estendida com parâmetro opcional `barberId` para suportar drag entre Resources:

```typescript
export async function updateAppointmentDate(
  id: string,
  newDate: string,
  barberId?: string  // novo
) {
  // ...auth check...
  const updateData: { appointment_date: string; barber_id?: string | null } = {
    appointment_date: newDate,
  }
  if (barberId !== undefined) {
    updateData.barber_id = barberId || null
  }
  // ...update + revalidate...
}
```

- Se `barberId` não for passado → apenas atualiza data (drag horizontal)
- Se `barberId` for passado → atualiza data + barbeiro (drag entre Resources)
- Se `barberId` for `''` → seta `barber_id: null` (movido para "Sem barbeiro")

---

## 7. TESTES

### Cobertura em `actions.test.ts`

| Teste | Cenário |
|-------|---------|
| `updateAppointmentDate` — retorna erro se não autenticado | Auth check |
| `updateAppointmentDate` — atualiza data com sucesso | Drag horizontal (sem barberId) |
| `updateAppointmentDate` — atualiza data e barbeiro com sucesso | Drag entre Resources (com barberId) |

---

## 8. CSS & ESTILIZAÇÃO

### 8.1 `scheduler-theme.css`

Overrides que integram o visual do Bryntum com o design system Shadcn/Tailwind:

- **Grid**: `background-color: var(--card)`, `border-color: var(--border)`
- **Eventos cancelados**: `.event-cancelled` — opacity 0.5, background cinza, text-decoration line-through
- **Eventos completados**: `.event-completed` — opacity 0.7
- **Indicador de hora atual**: Linha vermelha (`#EF4444`)
- **Scrollbar customizado**: Estilo thin integrado ao tema
- **Cores de texto**: Usa `var(--foreground)` e `var(--muted-foreground)`

### 8.2 Cores dos Barbeiros

Array `BARBER_COLORS` com 10 cores (blue, violet, amber, pink, teal, orange, cyan, lime, rose, indigo). Ciclado via `index % BARBER_COLORS.length`.

---

## 9. DECISÕES TÉCNICAS

| Decisão | Justificativa |
|---------|---------------|
| **Trial version** | Avaliação/desenvolvimento; migrar para licensed em produção |
| **Tema Svalbard** | Visual clean que harmoniza com Shadcn/Tailwind |
| **Barbeiros como Resources** | UX natural — cada barbeiro é uma linha, visão clara da agenda de todos |
| **Toolbar React (não Bryntum tbar)** | Consistência visual com Shadcn buttons; mais controle sobre DateTime |
| **Config estática fora do componente** | Best practice Bryntum — evita re-instanciação do scheduler |
| **dynamic import com ssr: false** | Bryntum usa DOM APIs; incompatível com SSR |
| **eventRenderer com JSX** | Permite formatação rica (horário + cliente + serviço) via React |
| **CSS overrides com custom properties** | Adapta automaticamente ao dark/light mode sem JS |

---

## 10. FLUXO DE DADOS

```
page.tsx (Server Component)
  ├── fetch: appointments (join services, barbers)
  ├── fetch: services, clients, barbers, paymentMethods
  └── render: <AppointmentsCalendarView ...props />
        │
        ├── useMemo → resources (barbers → Bryntum Resources)
        ├── useMemo → events (appointments → Bryntum Events)
        ├── useMemo → timeSpan (viewMode + date → startDate/endDate)
        │
        ├── <SchedulerWrapper> (dynamic, ssr: false)
        │     ├── onScheduleClick → setSelectedDate → CreateAppointmentDialog
        │     ├── onEventClick → setSelectedEvent → AppointmentDetailsDialog
        │     └── onAfterEventDrop → updateAppointmentDate(id, date, barberId?)
        │
        ├── <CreateAppointmentDialog> → createAppointment (server action)
        └── <AppointmentDetailsDialog> → completeAppointmentWithTransaction / updateAppointmentStatus
```

---

## 11. LIMITAÇÕES & TODO

- [ ] **Licenciamento**: Versão Trial exibe watermark; necessário adquirir licença para produção
- [ ] **Responsividade mobile**: Scheduler funciona em mobile mas a experiência é otimizada para desktop
- [ ] **Filtro por barbeiro**: Não há filtro individual — todos os barbeiros são exibidos simultaneamente (considerar `resourceFilter` feature)
- [ ] **Zoom**: Zoom por scroll e double-click estão desabilitados; considerar habilitar para visualização semanal
- [ ] **Drag de eventos cancelados/completados**: Bloqueado por `draggable: false` no event data

---
name: bryntum
description: >
  Skill para integração, uso avançado, dicas e troubleshooting da biblioteca Bryntum (Grid, Scheduler, Gantt, Calendar, TaskBoard) em React/Next.js.
  Use esta skill quando o usuário pedir: grids avançados, agendamento, Gantt, calendários, task boards, customização visual, performance, integração com TypeScript, SSR/Next.js, temas, features, renderização customizada, problemas comuns, exemplos, links oficiais, licenciamento, ou mencionar "Bryntum".
---

# Bryntum (React) — Guia Completo

## 1. Produtos Bryntum
- [Grid](https://bryntum.com/products/grid/docs)
- [Scheduler](https://bryntum.com/products/scheduler/docs)
- [Gantt](https://bryntum.com/products/gantt/docs)
- [Calendar](https://bryntum.com/products/calendar/docs)
- [TaskBoard](https://bryntum.com/products/taskboard/docs)

## 2. Instalação
- Trial: `npm install @bryntum/grid@npm:@bryntum/grid-trial@<versão> @bryntum/grid-react@<versão>`
- Licenciado: [Guia de acesso privado](https://bryntum.com/products/grid/docs/guide/Grid/npm/repository/private-repository-access)
- Requer: React >=16, recomendado >=18; TypeScript >=3.6 (recomendado >=4)

## 3. Uso Básico (Grid)
```tsx
// AppConfig.ts
export const gridProps = {
  columns: [
    { text: 'Nome', field: 'name', flex: 1 },
    { text: 'Idade', field: 'age', width: 100, type: 'number' }
  ],
  data: [
    { id: 1, name: 'Maria', age: 30 },
    { id: 2, name: 'João', age: 40 }
  ]
}

// App.tsx
import { BryntumGrid } from '@bryntum/grid-react'
import { gridProps } from './AppConfig'
import './App.scss'

export default function App() {
  return <BryntumGrid {...gridProps} />
}
```
- Importe temas e FontAwesome em `App.scss`:
```scss
@import '@bryntum/grid/fontawesome/css/fontawesome.css';
@import '@bryntum/grid/fontawesome/css/solid.css';
@import '@bryntum/grid/grid.css';
@import '@bryntum/grid/svalbard-light.css'; // Ou outro tema
```

## 4. Principais Dicas e Boas Práticas
- **Configuração estática**: defina colunas e opções fora do componente React para evitar re-renderizações desnecessárias.
- **Configuração dinâmica**: use `useState` para configs que mudam com o estado.
- **Acesse a instância nativa**: `const gridRef = useRef(); <BryntumGrid ref={gridRef} ... />` → `gridRef.current.instance`.
- **SSR/Next.js**: use `dynamic(() => import(...), { ssr: false })` e crie um wrapper para refs funcionarem.
- **TypeScript**: use os tipos `BryntumGridProps` e configs do pacote.
- **Temas**: importe apenas um tema por vez ou use `<BryntumThemeCombo />` para troca dinâmica.
- **Customização**: renderize React components em células (`renderer`), headers (`headerRenderer`), tooltips, widgets.
- **Features**: ative/desative features via props (`cellEditFeature`, `groupFeature`, etc).
- **Performance**: evite configs inline, use stores para grandes volumes de dados, desative features não usadas.
- **Licenciamento**: [Guia de licenças](https://bryntum.com/licensing/)

## 5. Exemplos Avançados
- [Demos React oficiais](https://bryntum.com/products/grid/examples/?framework=react)
- [Custom cell renderer](https://bryntum.com/products/grid/examples/frameworks/react-vite/renderer-context/dist/)
- [Cell editor React](https://bryntum.com/products/grid/examples/frameworks/react-vite/cell-edit/)
- [Next.js integration](https://bryntum.com/products/grid/docs/guide/Grid/quick-start/nextjs)

## 6. Armadilhas Comuns
- Não usar wrapper React: perde suporte a JSX em renderers/editors.
- Tentar SSR: Bryntum é client-only, sempre use `ssr: false`.
- Não importar CSS/tema: grid não renderiza corretamente.
- Não passar `ref` para editores customizados: editores não funcionam.
- Não implementar métodos obrigatórios em editores customizados: precisa de `getValue`, `setValue`, `isValid`, `focus`.
- Copiar toda a distribuição para o projeto: só copie arquivos necessários.

## 7. Troubleshooting
- [Guia de troubleshooting React](https://bryntum.com/products/grid/docs/guide/Grid/integration/react/troubleshooting)
- React 18+ StrictMode: mount/unmount/mount pode causar problemas de carregamento de dados.
- Dúvidas: [Fórum oficial](https://forum.bryntum.com/)

## 8. Links Úteis
- [API completa Grid](https://bryntum.com/products/grid/docs/api/api)
- [Guia React](https://bryntum.com/products/grid/docs/guide/Grid/integration/react/guide)
- [Guia Next.js](https://bryntum.com/products/grid/docs/guide/Grid/quick-start/nextjs)
- [Guia de temas](https://bryntum.com/products/grid/docs/guide/Grid/customization/styling)
- [Licenciamento](https://bryntum.com/licensing/)
- [Contato Bryntum](https://bryntum.com/contact/)

---

> Use esta skill para qualquer dúvida sobre Bryntum em React, integração, customização, performance, troubleshooting, exemplos ou melhores práticas.

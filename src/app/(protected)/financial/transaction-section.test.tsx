import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('./transaction-list', () => ({
  TransactionList: ({ transactions }: { transactions: { id: string }[] }) => (
    <div data-testid="transaction-list">
      {transactions.map((t) => (
        <div key={t.id} data-testid="transaction-item">
          {t.id}
        </div>
      ))}
      {transactions.length === 0 && <p>Nenhuma movimentação</p>}
    </div>
  ),
}))

function createTransactions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${i + 1}`,
    type: i % 2 === 0 ? ('income' as const) : ('expense' as const),
    amount: 100 + i,
    description: `Descrição item ${i + 1}`,
    category: 'Outros',
    date: '2026-04-01',
    source: 'manual' as const,
    paymentMethodName: null,
  }))
}

describe('TransactionSection', () => {
  async function renderComponent(transactionCount = 5) {
    const { TransactionSection } = await import('./transaction-section')
    const transactions = createTransactions(transactionCount)
    const result = render(<TransactionSection transactions={transactions} />)
    return { ...result, transactions }
  }

  it('renderiza o campo de busca', async () => {
    await renderComponent()
    expect(screen.getByPlaceholderText('Buscar por descrição...')).toBeInTheDocument()
  })

  it('renderiza o título do extrato', async () => {
    await renderComponent()
    expect(screen.getByText('Extrato Mensal')).toBeInTheDocument()
  })

  it('renderiza todas as transações quando há menos de 30', async () => {
    await renderComponent(10)
    expect(screen.getAllByTestId('transaction-item')).toHaveLength(10)
  })

  it('não exibe controles de paginação quando há 30 ou menos itens', async () => {
    await renderComponent(30)
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument()
  })

  it('limita a 30 transações por página e exibe paginação', async () => {
    await renderComponent(50)
    expect(screen.getAllByTestId('transaction-item')).toHaveLength(30)
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    expect(screen.getByText(/Mostrando 1–30 de 50/)).toBeInTheDocument()
  })

  it('navega para próxima página', async () => {
    const user = userEvent.setup()
    await renderComponent(50)

    await user.click(screen.getByRole('button', { name: /Próxima/ }))

    expect(screen.getAllByTestId('transaction-item')).toHaveLength(20)
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
    expect(screen.getByText(/Mostrando 31–50 de 50/)).toBeInTheDocument()
  })

  it('navega para página anterior', async () => {
    const user = userEvent.setup()
    await renderComponent(50)

    await user.click(screen.getByRole('button', { name: /Próxima/ }))
    await user.click(screen.getByRole('button', { name: /Anterior/ }))

    expect(screen.getAllByTestId('transaction-item')).toHaveLength(30)
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  })

  it('desabilita botão Anterior na primeira página', async () => {
    await renderComponent(50)
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
  })

  it('desabilita botão Próxima na última página', async () => {
    const user = userEvent.setup()
    await renderComponent(50)

    await user.click(screen.getByRole('button', { name: /Próxima/ }))

    expect(screen.getByRole('button', { name: /Próxima/ })).toBeDisabled()
  })

  it('filtra transações pela descrição ao digitar na busca', async () => {
    const user = userEvent.setup()
    await renderComponent(35)

    await user.type(screen.getByPlaceholderText('Buscar por descrição...'), 'item 1')

    // "item 1", "item 10"..."item 19" = matches containing "item 1"
    const items = screen.getAllByTestId('transaction-item')
    items.forEach((item) => {
      expect(item.textContent?.toLowerCase()).toContain('1')
    })
  })

  it('reseta para página 1 ao buscar', async () => {
    const user = userEvent.setup()
    await renderComponent(60)

    // Go to page 2
    await user.click(screen.getByRole('button', { name: /Próxima/ }))
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()

    // Type search — should reset to page 1
    await user.type(screen.getByPlaceholderText('Buscar por descrição...'), 'item')

    expect(screen.queryByText(/Página 2/)).not.toBeInTheDocument()
  })

  it('exibe estado vazio quando busca não encontra resultados', async () => {
    const user = userEvent.setup()
    await renderComponent(5)

    await user.type(screen.getByPlaceholderText('Buscar por descrição...'), 'xyz-nao-existe')

    expect(screen.getByText('Nenhuma movimentação')).toBeInTheDocument()
  })

  it('busca é case-insensitive', async () => {
    const user = userEvent.setup()
    await renderComponent(5)

    await user.type(screen.getByPlaceholderText('Buscar por descrição...'), 'DESCRIÇÃO ITEM 1')

    expect(screen.getAllByTestId('transaction-item').length).toBeGreaterThanOrEqual(1)
  })
})

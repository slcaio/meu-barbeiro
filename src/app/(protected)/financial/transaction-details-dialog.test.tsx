import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TransactionDetail } from './transaction-details-dialog'

const updateTransactionMock = vi.fn()
const deleteTransactionMock = vi.fn()

vi.mock('@/app/financial/actions', () => ({
  updateTransaction: (formData: FormData) => updateTransactionMock(formData),
  deleteTransaction: (id: string) => deleteTransactionMock(id),
}))

function baseTransaction(overrides: Partial<TransactionDetail> = {}): TransactionDetail {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 50,
    description: 'Conta de luz',
    category: 'Outros',
    date: '2026-04-08',
    source: 'manual',
    paymentMethodName: null,
    isCogs: false,
    stockMovementId: null,
    ...overrides,
  }
}

describe('TransactionDetailsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza detalhes no modo de visualização', async () => {
    const { TransactionDetailsDialog } = await import('./transaction-details-dialog')
    render(
      <TransactionDetailsDialog
        transaction={baseTransaction()}
        open={true}
        onOpenChange={() => {}}
        categories={[]}
      />,
    )
    expect(screen.getByText('Conta de luz')).toBeInTheDocument()
    expect(screen.getByText('Despesa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Editar/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Excluir/ })).toBeInTheDocument()
  })

  it('exibe aviso e oculta ações quando is_cogs', async () => {
    const { TransactionDetailsDialog } = await import('./transaction-details-dialog')
    render(
      <TransactionDetailsDialog
        transaction={baseTransaction({ isCogs: true, category: 'Custo de Produto' })}
        open={true}
        onOpenChange={() => {}}
        categories={[]}
      />,
    )
    expect(screen.getByText(/Custo de Mercadoria Vendida/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
  })

  it('oculta ações quando source = appointment', async () => {
    const { TransactionDetailsDialog } = await import('./transaction-details-dialog')
    render(
      <TransactionDetailsDialog
        transaction={baseTransaction({ source: 'appointment' })}
        open={true}
        onOpenChange={() => {}}
        categories={[]}
      />,
    )
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
  })

  it('exige confirmação antes de excluir', async () => {
    const user = userEvent.setup()
    const { TransactionDetailsDialog } = await import('./transaction-details-dialog')
    deleteTransactionMock.mockResolvedValue({ success: 'ok' })
    render(
      <TransactionDetailsDialog
        transaction={baseTransaction()}
        open={true}
        onOpenChange={() => {}}
        categories={[]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^Excluir/ }))
    // First click → inline confirm
    expect(deleteTransactionMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Confirmar exclusão/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Confirmar exclusão/ }))
    expect(deleteTransactionMock).toHaveBeenCalledWith('tx-1')
  })

  it('exibe erro retornado por deleteTransaction', async () => {
    const user = userEvent.setup()
    const { TransactionDetailsDialog } = await import('./transaction-details-dialog')
    deleteTransactionMock.mockResolvedValue({ error: 'Não permitido.' })
    render(
      <TransactionDetailsDialog
        transaction={baseTransaction()}
        open={true}
        onOpenChange={() => {}}
        categories={[]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^Excluir/ }))
    await user.click(screen.getByRole('button', { name: /Confirmar exclusão/ }))

    expect(await screen.findByText('Não permitido.')).toBeInTheDocument()
  })

  it('alterna para modo edição ao clicar em Editar', async () => {
    const user = userEvent.setup()
    const { TransactionDetailsDialog } = await import('./transaction-details-dialog')
    render(
      <TransactionDetailsDialog
        transaction={baseTransaction()}
        open={true}
        onOpenChange={() => {}}
        categories={[{ id: 'c1', name: 'Outros', type: 'expense' }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Editar/ }))
    expect(screen.getByText('Editar Transação')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Salvar/ })).toBeInTheDocument()
  })

  it('não renderiza nada quando transaction é null', async () => {
    const { TransactionDetailsDialog } = await import('./transaction-details-dialog')
    const { container } = render(
      <TransactionDetailsDialog
        transaction={null}
        open={true}
        onOpenChange={() => {}}
        categories={[]}
      />,
    )
    expect(container.firstChild).toBeNull()
  })
})

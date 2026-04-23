import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './modal'

describe('Modal', () => {
  it('não renderiza quando fechado', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Teste">
        <p>Conteúdo</p>
      </Modal>
    )
    expect(container.innerHTML).toBe('')
  })

  it('renderiza quando aberto', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Meu Modal">
        <p>Conteúdo do modal</p>
      </Modal>
    )
    expect(screen.getByRole('dialog', { name: 'Meu Modal' })).toBeInTheDocument()
    expect(screen.getByText('Meu Modal')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo do modal')).toBeInTheDocument()
  })

  it('mostra título correto', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Detalhes">
        <p>Info</p>
      </Modal>
    )
    expect(screen.getByText('Detalhes')).toBeInTheDocument()
  })

  it('chama onClose ao clicar no botão de fechar', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Fechar">
        <p>Conteúdo</p>
      </Modal>
    )
    await user.click(screen.getByRole('button', { name: /close modal/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renderiza children corretamente', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Teste">
        <button>Ação Interna</button>
      </Modal>
    )
    expect(screen.getByRole('button', { name: 'Ação Interna' })).toBeInTheDocument()
  })

  it('limita a altura e mantém área rolável', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Longo">
        <p>Conteúdo</p>
      </Modal>
    )

    const dialog = screen.getByRole('dialog', { name: 'Longo' })
    expect(dialog.className).toContain('max-h-[calc(100vh-6rem)]')
    expect(dialog.className).toContain('overflow-hidden')
  })
})

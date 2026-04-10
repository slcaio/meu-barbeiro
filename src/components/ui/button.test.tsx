import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('renderiza com texto correto', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByRole('button', { name: 'Clique aqui' })).toBeInTheDocument()
  })

  it('aplica variante default', () => {
    render(<Button>Default</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-variant', 'default')
  })

  it('aplica variante destructive', () => {
    render(<Button variant="destructive">Excluir</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-variant', 'destructive')
  })

  it('aplica variante outline', () => {
    render(<Button variant="outline">Cancelar</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-variant', 'outline')
  })

  it('aplica variante ghost', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-variant', 'ghost')
  })

  it('aplica size lg', () => {
    render(<Button size="lg">Grande</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-size', 'lg')
  })

  it('dispara onClick ao clicar', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clique</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('mostra loader quando isLoading', () => {
    render(<Button isLoading>Salvando</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('desabilita botão quando disabled', () => {
    render(<Button disabled>Desabilitado</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('não dispara onClick quando disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Clique</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('não dispara onClick quando isLoading', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button isLoading onClick={handleClick}>Clique</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/recovery',
  useActionState: (action: any, initial: any) => [initial, vi.fn(), false],
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useActionState: (action: any, initial: any) => [initial, vi.fn(), false],
    useTransition: () => [false, vi.fn()],
  }
})

vi.mock('@/app/auth/actions', () => ({
  recoverPassword: vi.fn(),
}))

describe('Recovery Page', () => {
  it('renderiza formulário de recuperação', async () => {
    const RecoveryPage = (await import('./page')).default
    render(<RecoveryPage />)
    expect(screen.getByText('Recuperar Senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renderiza descrição', async () => {
    const RecoveryPage = (await import('./page')).default
    render(<RecoveryPage />)
    expect(screen.getByText(/Digite seu email para receber/)).toBeInTheDocument()
  })

  it('renderiza link para login', async () => {
    const RecoveryPage = (await import('./page')).default
    render(<RecoveryPage />)
    expect(screen.getByText('Voltar para o login')).toBeInTheDocument()
  })

  it('campo de email é obrigatório', async () => {
    const RecoveryPage = (await import('./page')).default
    render(<RecoveryPage />)
    expect(screen.getByLabelText('Email')).toBeRequired()
  })

  it('renderiza botão de enviar', async () => {
    const RecoveryPage = (await import('./page')).default
    render(<RecoveryPage />)
    expect(screen.getByRole('button', { name: 'Enviar Link' })).toBeInTheDocument()
  })
})

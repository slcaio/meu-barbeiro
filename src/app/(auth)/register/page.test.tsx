import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/register',
  useActionState: (action: unknown, initial: unknown) => [initial, vi.fn(), false],
}))

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useActionState: (action: unknown, initial: unknown) => [initial, vi.fn(), false],
    useTransition: () => [false, vi.fn()],
  }
})

vi.mock('@/app/auth/actions', () => ({
  signup: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  Scissors: () => <svg data-testid="scissors-icon" />,
}))

describe('Register Page', () => {
  it('renderiza formulário de cadastro', async () => {
    const RegisterPage = (await import('./page')).default
    render(<RegisterPage />)
    expect(screen.getByText('Criar Conta')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome Completo')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('renderiza link para login', async () => {
    const RegisterPage = (await import('./page')).default
    render(<RegisterPage />)
    expect(screen.getByText('Entrar')).toBeInTheDocument()
  })

  it('renderiza descrição do formulário', async () => {
    const RegisterPage = (await import('./page')).default
    render(<RegisterPage />)
    expect(screen.getByText(/Comece a gerenciar sua barbearia/)).toBeInTheDocument()
  })

  it('campos são obrigatórios', async () => {
    const RegisterPage = (await import('./page')).default
    render(<RegisterPage />)
    expect(screen.getByLabelText('Nome Completo')).toBeRequired()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Senha')).toBeRequired()
  })
})

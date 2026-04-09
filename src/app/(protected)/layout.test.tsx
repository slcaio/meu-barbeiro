import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
}))

vi.mock('@/app/auth/actions', () => ({
  signout: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <svg data-testid="dashboard-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  DollarSign: () => <svg data-testid="dollar-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  LogOut: () => <svg data-testid="logout-icon" />,
  Menu: () => <svg data-testid="menu-icon" />,
  Scissors: () => <svg data-testid="scissors-icon" />,
  Users: () => <svg data-testid="users-icon" />,
}))

describe('Protected Layout', () => {
  it('renderiza navegação com itens corretos', async () => {
    const DashboardLayout = (await import('./layout')).default
    render(
      <DashboardLayout>
        <div>Conteúdo</div>
      </DashboardLayout>
    )
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Agenda').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Clientes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Financeiro').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Configurações').length).toBeGreaterThan(0)
  })

  it('renderiza logo Meu Barbeiro', async () => {
    const DashboardLayout = (await import('./layout')).default
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )
    expect(screen.getAllByText('Meu Barbeiro').length).toBeGreaterThan(0)
  })

  it('renderiza children', async () => {
    const DashboardLayout = (await import('./layout')).default
    render(
      <DashboardLayout>
        <div>Meu conteúdo protegido</div>
      </DashboardLayout>
    )
    expect(screen.getByText('Meu conteúdo protegido')).toBeInTheDocument()
  })

  it('renderiza botão de sair', async () => {
    const DashboardLayout = (await import('./layout')).default
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )
    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('renderiza botão de menu mobile', async () => {
    const DashboardLayout = (await import('./layout')).default
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )
    expect(screen.getByText('Open sidebar')).toBeInTheDocument()
  })

  it('links de navegação apontam para rotas corretas', async () => {
    const DashboardLayout = (await import('./layout')).default
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    )
    const links = screen.getAllByRole('link')
    const hrefs = links.map(link => link.getAttribute('href'))
    
    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/appointments')
    expect(hrefs).toContain('/clients')
    expect(hrefs).toContain('/financial')
    expect(hrefs).toContain('/settings')
  })
})

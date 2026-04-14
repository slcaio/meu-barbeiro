'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  Settings, 
  LogOut, 
  Menu,
  Scissors,
  Users,
  X,
  Package,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { signout } from '@/app/auth/actions'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agenda', href: '/appointments', icon: Calendar },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Estoque', href: '/stock', icon: Package },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        desktopOpen ? "md:translate-x-0" : "md:-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Scissors className="h-5 w-5 text-primary-foreground" />
          </div>
          <Link href="/dashboard" className="flex items-center">
            <span className="text-lg font-bold text-sidebar-foreground">Meu Barbeiro</span>
          </Link>
          {/* Mobile: close button */}
          <button
            className="ml-auto md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          {/* Desktop: collapse button */}
          <button
            className="ml-auto hidden md:flex text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            onClick={() => setDesktopOpen(false)}
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                  )}
                />
                {item.name}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2">
            <form action={signout} className="flex-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </Button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex flex-1 flex-col transition-[padding] duration-300 ease-in-out",
        desktopOpen ? "md:pl-[280px]" : "md:pl-0"
      )}>
        {/* Header — visible on all screen sizes */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4">
          {/* Mobile: open sidebar */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <span className="sr-only">Abrir menu</span>
            <Menu className="h-5 w-5" />
          </button>
          {/* Desktop: toggle sidebar — only visible when sidebar is closed */}
          <button
            type="button"
            className={cn(
              "items-center justify-center rounded-lg p-2 text-foreground/60 hover:bg-accent hover:text-foreground transition-colors",
              desktopOpen ? "hidden" : "hidden md:inline-flex"
            )}
            onClick={() => setDesktopOpen(prev => !prev)}
          >
            <span className="sr-only">Toggle menu</span>
            <Menu className="h-5 w-5" />
          </button>
          <div className={cn(
            "flex items-center gap-2",
            desktopOpen ? "md:hidden" : ""
          )}>
            <Scissors className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold text-foreground">Meu Barbeiro</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

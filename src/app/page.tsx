import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Scissors, Calendar, DollarSign, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Scissors className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Meu Barbeiro</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Cadastrar</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Gerencie sua barbearia{' '}
            <span className="text-primary">de forma profissional</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Agendamentos, controle financeiro e gestão de clientes em um só lugar. 
            Simplifique seu dia a dia e foque no que você faz de melhor.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">Começar Agora</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8">Acessar Painel</Button>
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 gap-4 pt-12 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-semibold">Agendamentos</h3>
              <p className="text-sm text-muted-foreground">Organize sua agenda com facilidade</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold">Financeiro</h3>
              <p className="text-sm text-muted-foreground">Controle receitas e despesas</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="font-semibold">Clientes</h3>
              <p className="text-sm text-muted-foreground">Gerencie sua base de clientes</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Meu Barbeiro. Todos os direitos reservados.
      </footer>
    </div>
  )
}

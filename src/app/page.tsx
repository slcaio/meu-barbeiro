import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Scissors } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Scissors className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Meu Barbeiro</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button>Cadastrar</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          Gerencie sua barbearia <br className="hidden sm:inline" />
          <span className="text-blue-600">de forma profissional</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          Agendamentos, controle financeiro e gestão de clientes em um só lugar. 
          Simplifique seu dia a dia e foque no que você faz de melhor.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/register">
            <Button size="lg" className="px-8">Começar Agora</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="px-8">Acessar Painel</Button>
          </Link>
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Meu Barbeiro. Todos os direitos reservados.
      </footer>
    </div>
  )
}

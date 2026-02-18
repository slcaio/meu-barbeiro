import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-10 w-10 text-red-600" />
      </div>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
        Página não encontrada
      </h1>
      <p className="mt-4 max-w-md text-lg text-gray-600">
        Ops! A página que você está procurando não existe ou foi movida.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/">
          <Button size="lg">Voltar ao Início</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="lg">Fazer Login</Button>
        </Link>
      </div>
    </div>
  )
}

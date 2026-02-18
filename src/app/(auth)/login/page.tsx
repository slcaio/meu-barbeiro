'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransition } from 'react'

const initialState = {
  error: null as string | null,
}

export default function LoginPage() {
  // @ts-ignore
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
          <CardDescription className="text-center">
            Digite seu email e senha para acessar o painel
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="/recovery"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            {state?.error && (
              <div className="text-sm text-red-500 text-center">{state.error}</div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" isLoading={isPending}>
              Entrar
            </Button>
          </CardFooter>
        </form>
        <div className="px-8 pb-8 text-center text-sm text-gray-500">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
            Cadastre-se
          </Link>
        </div>
      </Card>
    </div>
  )
}

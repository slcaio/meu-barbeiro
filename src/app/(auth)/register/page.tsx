'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Scissors } from 'lucide-react'

const initialState = {
  error: null as string | null,
  success: null as string | null,
}

export default function RegisterPage() {
  // @ts-ignore
  const [state, formAction, isPending] = useActionState(signup, initialState)
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center">
            Comece a gerenciar sua barbearia hoje mesmo
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" placeholder="Seu Nome" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>
            {state?.error && (
              <div className="text-sm text-destructive text-center">{state.error}</div>
            )}
            {state?.success && (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 text-center">{state.success}</div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" isLoading={isPending}>
              Cadastrar
            </Button>
          </CardFooter>
        </form>
        <div className="px-8 pb-8 text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Entrar
          </Link>
        </div>
      </Card>
    </div>
  )
}

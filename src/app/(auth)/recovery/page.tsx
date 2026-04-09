'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { recoverPassword } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransition } from 'react'

const initialState = {
  error: null as string | null,
  success: null as string | null,
}

export default function RecoveryPage() {
  // @ts-ignore
  const [state, formAction, isPending] = useActionState(recoverPassword, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Recuperar Senha</CardTitle>
          <CardDescription className="text-center">
            Digite seu email para receber um link de redefinição
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
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
              Enviar Link
            </Button>
          </CardFooter>
        </form>
        <div className="px-8 pb-8 text-center text-sm text-muted-foreground">
          Lembrou a senha?{' '}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Voltar para o login
          </Link>
        </div>
      </Card>
    </div>
  )
}

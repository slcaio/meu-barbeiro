import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scissors, Store, User } from 'lucide-react'

export default function SettingsPage() {
  const settingsModules = [
    {
      title: 'Serviços',
      description: 'Gerencie os serviços oferecidos, preços e duração.',
      href: '/settings/services',
      icon: Scissors,
    },
    {
      title: 'Barbearia',
      description: 'Atualize informações da barbearia, endereço e horários.',
      href: '/settings/business',
      icon: Store,
    },
    {
      title: 'Perfil',
      description: 'Gerencie suas informações pessoais e senha.',
      href: '/settings/profile',
      icon: User,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua barbearia e conta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsModules.map((module) => (
          <Link key={module.title} href={module.href}>
            <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <module.icon className="h-5 w-5 text-blue-600" />
                  <CardTitle>{module.title}</CardTitle>
                </div>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

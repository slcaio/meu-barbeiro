import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Scissors, Store, Tag, User, Users } from 'lucide-react'

export default function SettingsPage() {
  const settingsModules = [
    {
      title: 'Serviços',
      description: 'Gerencie os serviços oferecidos, preços e duração.',
      href: '/settings/services',
      icon: Scissors,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Equipe',
      description: 'Gerencie os barbeiros da sua barbearia.',
      href: '/settings/barbers',
      icon: Users,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Métodos de Pagamento',
      description: 'Gerencie formas de pagamento e taxas.',
      href: '/settings/payment-methods',
      icon: CreditCard,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Categorias',
      description: 'Gerencie categorias de receitas e despesas.',
      href: '/settings/categories',
      icon: Tag,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Barbearia',
      description: 'Atualize informações da barbearia, endereço e horários.',
      href: '/settings/business',
      icon: Store,
      iconColor: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Perfil',
      description: 'Gerencie suas informações pessoais e senha.',
      href: '/settings/profile',
      icon: User,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua barbearia e conta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsModules.map((module) => (
          <Link key={module.title} href={module.href}>
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${module.bgColor}`}>
                    <module.icon className={`h-5 w-5 ${module.iconColor}`} />
                  </div>
                  <CardTitle className="text-base group-hover:text-primary transition-colors">{module.title}</CardTitle>
                </div>
                <CardDescription className="pl-[52px]">{module.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

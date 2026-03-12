'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, UserCog, MapPin, ClipboardList, Dumbbell } from 'lucide-react'
import Link from 'next/link'

const stats = [
  { label: 'Torneos', icon: Trophy, href: '/admin/torneos', color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Equipos', icon: Users, href: '/admin/equipos', color: 'text-green-600 dark:text-green-400' },
  { label: 'Jugadores', icon: UserCog, href: '/admin/jugadores', color: 'text-purple-600 dark:text-purple-400' },
  { label: 'Canchas', icon: MapPin, href: '/admin/canchas', color: 'text-orange-600 dark:text-orange-400' },
  { label: 'Inscripciones', icon: ClipboardList, href: '/admin/inscripciones', color: 'text-red-600 dark:text-red-400' },
  { label: 'Disciplinas', icon: Dumbbell, href: '/admin/disciplinas', color: 'text-teal-600 dark:text-teal-400' },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración de Overtime.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <CardDescription>Gestionar {stat.label.toLowerCase()}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
            <CardDescription>Acciones más frecuentes</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href="/admin/torneos/nuevo"
              className="rounded-md border p-3 text-sm transition-colors hover:bg-accent"
            >
              Crear nuevo torneo
            </Link>
            <Link
              href="/admin/equipos/nuevo"
              className="rounded-md border p-3 text-sm transition-colors hover:bg-accent"
            >
              Registrar equipo manualmente
            </Link>
            <Link
              href="/admin/inscripciones"
              className="rounded-md border p-3 text-sm transition-colors hover:bg-accent"
            >
              Ver inscripciones pendientes
            </Link>
            <Link
              href="/admin/jugadores/lista-negra"
              className="rounded-md border p-3 text-sm transition-colors hover:bg-accent"
            >
              Gestionar lista negra
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del sistema</CardTitle>
            <CardDescription>Estado actual de la plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versión</span>
              <span className="font-medium">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entorno</span>
              <span className="font-medium">
                {process.env.NODE_ENV === 'production' ? 'Producción' : 'Desarrollo'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { User } from '@/types'
import { formatDate, formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Mail, Phone, Calendar, DollarSign, TrendingUp } from 'lucide-react'

interface ProfileCardProps {
  user: User
}

const statusConfig = {
  activo: { label: 'Activo', className: 'bg-green-100 text-green-800' },
  no_verificado: { label: 'No Verificado', className: 'bg-yellow-100 text-yellow-800' },
  bloqueado: { label: 'Bloqueado', className: 'bg-red-100 text-red-800' },
}

const userTypeLabels = {
  cliente: 'Cliente',
  agente: 'Agente',
  super_agente: 'Super Agente',
}

export function ProfileCard({ user }: ProfileCardProps) {
  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const status = statusConfig[user.status]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Informacion Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.full_name}</h2>
              <Badge className={status.className}>
                {status.label}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Cuenta</p>
                <p className="font-medium">{userTypeLabels[user.user_type]}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informacion Financiera</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Capital Inicial</p>
                <p className="font-medium">{formatCurrency(user.initial_capital)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Balance Actual</p>
                <p className="text-xl font-bold">{formatCurrency(user.current_balance)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Porcentaje Garantizado</p>
                <p className="font-medium">{formatPercentage(user.guaranteed_percentage)}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Activacion</p>
                <p className="font-medium">
                  {user.activated_at ? formatDate(user.activated_at) : 'No activado'}
                </p>
              </div>
            </div>

            {user.yield_start_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Inicio de Rendimientos</p>
                  <p className="font-medium">{formatDate(user.yield_start_date)}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Miembro desde</p>
                <p className="font-medium">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

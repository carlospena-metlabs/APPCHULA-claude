import { User } from '@/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Wallet, Percent } from 'lucide-react'

interface StatsCardsProps {
  user: User
  totalYields: number
}

export function StatsCards({ user, totalYields }: StatsCardsProps) {
  const stats = [
    {
      title: 'Capital Inicial',
      value: formatCurrency(user.initial_capital),
      icon: Wallet,
      description: 'Tu inversion inicial',
    },
    {
      title: 'Balance Actual',
      value: formatCurrency(user.current_balance),
      icon: DollarSign,
      description: 'Saldo disponible',
    },
    {
      title: 'Rendimientos Totales',
      value: formatCurrency(totalYields),
      icon: TrendingUp,
      description: 'Ganancias acumuladas',
    },
    {
      title: 'Porcentaje Garantizado',
      value: formatPercentage(user.guaranteed_percentage),
      icon: Percent,
      description: 'Rendimiento mensual',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

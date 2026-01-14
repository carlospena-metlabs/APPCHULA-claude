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
      {stats.map((stat, index) => (
        <Card key={stat.title} className="border-border hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            {index === 2 && (
              <span className="inline-flex items-center mt-2 text-xs font-medium text-primary">
                <TrendingUp className="h-3 w-3 mr-1" />
                +4.03%
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

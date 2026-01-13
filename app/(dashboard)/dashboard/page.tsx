import { getCurrentUser } from '@/lib/actions/auth'
import { getClientDashboard } from '@/lib/actions/dashboard'
import { redirect } from 'next/navigation'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { BalanceChart } from '@/components/dashboard/balance-chart'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const dashboardData = await getClientDashboard(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenido, {user.full_name}
        </p>
      </div>

      {user.status === 'bloqueado' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu cuenta esta bloqueada. No puedes realizar operaciones ni generar rendimientos.
          </AlertDescription>
        </Alert>
      )}

      {user.status === 'no_verificado' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu cuenta aun no ha sido verificada. Algunas operaciones pueden estar limitadas.
          </AlertDescription>
        </Alert>
      )}

      <StatsCards user={dashboardData.user} totalYields={dashboardData.totalYields} />

      <BalanceChart data={dashboardData.balanceHistory} />
    </div>
  )
}

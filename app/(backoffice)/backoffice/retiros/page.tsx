import { Suspense } from 'react'
import { getAllWithdrawals, getWithdrawalStats } from '@/lib/actions/retiros'
import { WithdrawalsTable } from '@/components/backoffice/withdrawals-table'
import { WithdrawalsFilters } from '@/components/backoffice/withdrawals-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Clock, CheckCircle, DollarSign, AlertCircle } from 'lucide-react'
import { WithdrawalWithUser } from '@/types'

export default async function RetirosBackofficePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const status = params.status || 'todos'

  const [withdrawals, stats] = await Promise.all([
    getAllWithdrawals(status),
    getWithdrawalStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Retiros</h1>
        <p className="mt-1 text-slate-600">Gestion de solicitudes de retiro</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-slate-500">
              {formatCurrency(stats.pendingAmount)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCount}</div>
            <p className="text-xs text-slate-500">
              {formatCurrency(stats.approvedAmount)} por ejecutar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.pendingAmount + stats.approvedAmount)}
            </div>
            <p className="text-xs text-slate-500">
              En solicitudes activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requieren Accion</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingCount + stats.approvedCount}
            </div>
            <p className="text-xs text-slate-500">
              Solicitudes por procesar
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div>Cargando filtros...</div>}>
        <WithdrawalsFilters currentStatus={status} />
      </Suspense>

      <Suspense fallback={<div>Cargando retiros...</div>}>
        <WithdrawalsTable withdrawals={withdrawals as WithdrawalWithUser[]} />
      </Suspense>
    </div>
  )
}

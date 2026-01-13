import { getCurrentUser } from '@/lib/actions/auth'
import { getWithdrawals } from '@/lib/actions/dashboard'
import { canRequestWithdrawal, getNextWithdrawalWindow } from '@/lib/actions/retiros'
import { redirect } from 'next/navigation'
import { WithdrawalWindowInfoCard } from '@/components/dashboard/withdrawal-window-info'
import { WithdrawalForm } from '@/components/dashboard/withdrawal-form'
import { WithdrawalsList } from '@/components/dashboard/withdrawals-list'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default async function RetirosPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const [withdrawals, eligibility, windowInfo] = await Promise.all([
    getWithdrawals(user.id),
    canRequestWithdrawal(user.id),
    getNextWithdrawalWindow(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Retiros</h1>
        <p className="mt-1 text-muted-foreground">
          Gestiona tus solicitudes de retiro
        </p>
      </div>

      {user.status === 'bloqueado' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu cuenta esta bloqueada. No puedes solicitar retiros.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <WithdrawalWindowInfoCard windowInfo={windowInfo} />
        <WithdrawalForm
          userId={user.id}
          currentBalance={user.current_balance}
          canRequest={eligibility.canRequest}
          reason={eligibility.reason}
        />
      </div>

      <WithdrawalsList withdrawals={withdrawals} />
    </div>
  )
}

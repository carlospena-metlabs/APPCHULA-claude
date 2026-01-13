'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WithdrawalWithUser, WithdrawalStatus } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { approveWithdrawal, executeWithdrawal } from '@/lib/actions/retiros'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Play, Loader2 } from 'lucide-react'
import { RejectWithdrawalDialog } from './reject-withdrawal-dialog'

const statusColors: Record<WithdrawalStatus, string> = {
  solicitado: 'bg-yellow-100 text-yellow-800',
  aprobado: 'bg-blue-100 text-blue-800',
  ejecutado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
}

const statusLabels: Record<WithdrawalStatus, string> = {
  solicitado: 'Solicitado',
  aprobado: 'Aprobado',
  ejecutado: 'Ejecutado',
  rechazado: 'Rechazado',
}

const typeLabels: Record<string, string> = {
  parcial: 'Parcial',
  total: 'Total',
}

export function WithdrawalsTable({ withdrawals }: { withdrawals: WithdrawalWithUser[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [action, setAction] = useState<'approve' | 'execute' | null>(null)

  const handleApprove = async (id: string) => {
    setLoadingId(id)
    setAction('approve')
    const result = await approveWithdrawal(id)
    if (result.error) {
      alert(result.error)
    }
    setLoadingId(null)
    setAction(null)
    router.refresh()
  }

  const handleExecute = async (id: string) => {
    setLoadingId(id)
    setAction('execute')
    const result = await executeWithdrawal(id)
    if (result.error) {
      alert(result.error)
    }
    setLoadingId(null)
    setAction(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Ventana</TableHead>
            <TableHead>Solicitado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {withdrawals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                No hay retiros
              </TableCell>
            </TableRow>
          ) : (
            withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{withdrawal.user.full_name}</div>
                    <div className="text-sm text-slate-500">{withdrawal.user.email}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(withdrawal.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{typeLabels[withdrawal.type]}</Badge>
                </TableCell>
                <TableCell>{formatDate(withdrawal.withdrawal_window)}</TableCell>
                <TableCell>{formatDate(withdrawal.requested_at)}</TableCell>
                <TableCell>
                  <Badge className={statusColors[withdrawal.status]}>
                    {statusLabels[withdrawal.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {withdrawal.status === 'solicitado' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(withdrawal.id)}
                          disabled={loadingId === withdrawal.id}
                        >
                          {loadingId === withdrawal.id && action === 'approve' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          <span className="ml-1">Aprobar</span>
                        </Button>
                        <RejectWithdrawalDialog
                          withdrawalId={withdrawal.id}
                          userName={withdrawal.user.full_name}
                          amount={withdrawal.amount}
                        />
                      </>
                    )}
                    {withdrawal.status === 'aprobado' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleExecute(withdrawal.id)}
                        disabled={loadingId === withdrawal.id}
                      >
                        {loadingId === withdrawal.id && action === 'execute' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        <span className="ml-1">Ejecutar</span>
                      </Button>
                    )}
                    {withdrawal.status === 'rechazado' && withdrawal.notes && (
                      <span className="text-sm text-slate-500 italic">
                        {withdrawal.notes}
                      </span>
                    )}
                    {withdrawal.status === 'ejecutado' && (
                      <span className="text-sm text-green-600">
                        Completado
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

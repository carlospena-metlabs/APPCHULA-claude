'use client'

import { Withdrawal } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WithdrawalsListProps {
  withdrawals: Withdrawal[]
}

const statusConfig: Record<string, { label: string; variant: 'secondary' | 'default' | 'outline' | 'destructive'; className?: string }> = {
  solicitado: { label: 'Solicitado', variant: 'secondary' },
  aprobado: { label: 'Aprobado', variant: 'default' },
  ejecutado: { label: 'Ejecutado', variant: 'outline', className: 'bg-green-100 text-green-800' },
  rechazado: { label: 'Rechazado', variant: 'destructive' },
}

const typeLabels = {
  parcial: 'Parcial',
  total: 'Total',
}

export function WithdrawalsList({ withdrawals }: WithdrawalsListProps) {
  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Retiros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No tienes solicitudes de retiro
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Retiros</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha Solicitud</TableHead>
              <TableHead>Ventana</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => {
              const status = statusConfig[withdrawal.status]
              return (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    {formatDate(withdrawal.requested_at)}
                  </TableCell>
                  <TableCell>
                    {formatDate(withdrawal.withdrawal_window)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(withdrawal.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {typeLabels[withdrawal.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={status.variant} className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

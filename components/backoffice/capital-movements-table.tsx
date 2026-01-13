'use client'

import { CapitalMovement } from '@/types'
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

interface CapitalMovementsTableProps {
  movements: CapitalMovement[]
}

const typeLabels: Record<string, string> = {
  deposito_inicial: 'Deposito Inicial',
  incremento: 'Incremento',
  retiro: 'Retiro',
  comision_entrada: 'Comision Entrada',
  comision_salida: 'Comision Salida',
}

const typeColors: Record<string, string> = {
  deposito_inicial: 'bg-green-100 text-green-800',
  incremento: 'bg-blue-100 text-blue-800',
  retiro: 'bg-red-100 text-red-800',
  comision_entrada: 'bg-purple-100 text-purple-800',
  comision_salida: 'bg-orange-100 text-orange-800',
}

export function CapitalMovementsTable({ movements }: CapitalMovementsTableProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No hay movimientos de capital registrados.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Balance Antes</TableHead>
            <TableHead className="text-right">Balance Despues</TableHead>
            <TableHead>Ejecutado por</TableHead>
            <TableHead>Descripcion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const isAdjustment = movement.description?.startsWith('[AJUSTE]')
            const displayDescription = isAdjustment
              ? movement.description?.replace('[AJUSTE] ', '')
              : movement.description

            return (
              <TableRow key={movement.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(movement.created_at)}
                </TableCell>
                <TableCell>
                  <Badge className={typeColors[movement.type] || 'bg-slate-100 text-slate-800'}>
                    {isAdjustment ? 'Ajuste' : typeLabels[movement.type] || movement.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  <span className={
                    movement.type === 'retiro' || movement.type === 'comision_salida'
                      ? 'text-red-600'
                      : 'text-green-600'
                  }>
                    {movement.type === 'retiro' || movement.type === 'comision_salida' ? '-' : '+'}
                    {formatCurrency(movement.amount)}
                  </span>
                </TableCell>
                <TableCell className="text-right text-slate-600">
                  {formatCurrency(movement.balance_before)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(movement.balance_after)}
                </TableCell>
                <TableCell className="text-slate-600">
                  {movement.executed_by_user?.full_name || '-'}
                </TableCell>
                <TableCell className="max-w-xs truncate text-slate-600">
                  {displayDescription || '-'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

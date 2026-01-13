'use client'

import { MonthlyYield } from '@/types'
import { formatCurrency, formatPercentage, formatMonthYear } from '@/lib/utils'
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

interface YieldsTableProps {
  yields: MonthlyYield[]
}

export function YieldsTable({ yields }: YieldsTableProps) {
  if (yields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Rendimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No hay rendimientos registrados aun
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Rendimientos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead className="text-right">Porcentaje</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Balance Anterior</TableHead>
              <TableHead className="text-right">Balance Final</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yields.map((yld) => (
              <TableRow key={yld.id}>
                <TableCell className="font-medium capitalize">
                  {formatMonthYear(yld.year, yld.month)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercentage(yld.percentage_applied)}
                </TableCell>
                <TableCell className="text-right text-green-600 font-medium">
                  +{formatCurrency(yld.yield_amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(yld.balance_before)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(yld.balance_after)}
                </TableCell>
                <TableCell className="text-center">
                  {yld.is_proportional ? (
                    <Badge variant="secondary">Proporcional</Badge>
                  ) : (
                    <Badge variant="outline">Completo</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

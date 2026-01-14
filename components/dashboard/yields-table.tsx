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
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Periodo</TableHead>
              <TableHead className="text-right text-muted-foreground">Porcentaje</TableHead>
              <TableHead className="text-right text-muted-foreground">Monto</TableHead>
              <TableHead className="text-right text-muted-foreground">Balance Anterior</TableHead>
              <TableHead className="text-right text-muted-foreground">Balance Final</TableHead>
              <TableHead className="text-center text-muted-foreground">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yields.map((yld) => (
              <TableRow key={yld.id} className="border-border">
                <TableCell className="font-medium capitalize text-foreground">
                  {formatMonthYear(yld.year, yld.month)}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {formatPercentage(yld.percentage_applied)}
                </TableCell>
                <TableCell className="text-right text-primary font-medium">
                  +{formatCurrency(yld.yield_amount)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(yld.balance_before)}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {formatCurrency(yld.balance_after)}
                </TableCell>
                <TableCell className="text-center">
                  {yld.is_proportional ? (
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Proporcional</Badge>
                  ) : (
                    <Badge className="bg-primary/20 text-primary border-primary/30">Complete</Badge>
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

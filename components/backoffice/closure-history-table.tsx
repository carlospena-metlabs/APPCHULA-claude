'use client'

import { MonthlyClosure } from '@/types'
import { formatCurrency, formatMonthYear, formatDate } from '@/lib/utils'
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
import { CheckCircle, Clock } from 'lucide-react'

interface ClosureHistoryTableProps {
  closures: MonthlyClosure[]
}

export function ClosureHistoryTable({ closures }: ClosureHistoryTableProps) {
  if (closures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cierres</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">No hay cierres registrados.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Cierres</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-right">Porcentaje Base</TableHead>
                <TableHead className="text-right">Usuarios Afectados</TableHead>
                <TableHead className="text-right">Total Rendimientos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ejecutado por</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closures.map((closure) => (
                <TableRow key={closure.id}>
                  <TableCell className="font-medium">
                    {formatMonthYear(closure.year, closure.month)}
                  </TableCell>
                  <TableCell className="text-right">{closure.percentage}%</TableCell>
                  <TableCell className="text-right">{closure.total_users_affected}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {formatCurrency(closure.total_yield_amount)}
                  </TableCell>
                  <TableCell>
                    {closure.status === 'executed' ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ejecutado
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {closure.executed_by_user?.full_name || '-'}
                  </TableCell>
                  <TableCell>
                    {closure.executed_at ? formatDate(closure.executed_at) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

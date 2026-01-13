'use client'

import { useState, useMemo } from 'react'
import { YieldPreview } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, PlayCircle } from 'lucide-react'

interface YieldsPreviewTableProps {
  previews: YieldPreview[]
  onExecute: (approvedUserIds: string[]) => Promise<void>
  isExecuting: boolean
  monthLabel: string
}

export function YieldsPreviewTable({
  previews,
  onExecute,
  isExecuting,
  monthLabel,
}: YieldsPreviewTableProps) {
  const eligiblePreviews = useMemo(() => previews.filter((p) => p.isEligible), [previews])
  const ineligiblePreviews = useMemo(() => previews.filter((p) => !p.isEligible), [previews])

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    previews.filter((p) => p.isEligible).map((p) => p.userId)
  )

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === eligiblePreviews.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(eligiblePreviews.map((p) => p.userId))
    }
  }

  const totalYield = eligiblePreviews
    .filter((p) => selectedIds.includes(p.userId))
    .reduce((sum, p) => sum + p.yieldAmount, 0)

  const handleExecute = () => {
    if (selectedIds.length > 0) {
      onExecute(selectedIds)
    }
  }

  if (previews.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No hay usuarios con balance para calcular rendimientos.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa - {monthLabel}</CardTitle>
          <CardDescription>
            {eligiblePreviews.length} usuarios elegibles, {ineligiblePreviews.length} no elegibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === eligiblePreviews.length && eligiblePreviews.length > 0}
                      onCheckedChange={toggleAll}
                      disabled={eligiblePreviews.length === 0}
                    />
                  </TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Balance Actual</TableHead>
                  <TableHead className="text-right">% Garantizado</TableHead>
                  <TableHead className="text-right">% a Aplicar</TableHead>
                  <TableHead className="text-right">Rendimiento</TableHead>
                  <TableHead className="text-right">Balance Final</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligiblePreviews.map((preview) => (
                  <TableRow key={preview.userId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(preview.userId)}
                        onCheckedChange={() => toggleUser(preview.userId)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{preview.fullName}</div>
                        <div className="text-sm text-slate-500">{preview.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(preview.balanceBefore)}</TableCell>
                    <TableCell className="text-right">{preview.guaranteedPercentage}%</TableCell>
                    <TableCell className="text-right">
                      {preview.percentageToApply}%
                      {preview.isProportional && (
                        <span className="text-xs text-orange-500 ml-1">(50%)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      +{formatCurrency(preview.yieldAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(preview.balanceAfter)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Elegible
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {ineligiblePreviews.map((preview) => (
                  <TableRow key={preview.userId} className="bg-slate-50">
                    <TableCell>
                      <Checkbox disabled checked={false} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-500">{preview.fullName}</div>
                        <div className="text-sm text-slate-400">{preview.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      {formatCurrency(preview.balanceBefore)}
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      {preview.guaranteedPercentage}%
                    </TableCell>
                    <TableCell className="text-right text-slate-500">-</TableCell>
                    <TableCell className="text-right text-slate-500">-</TableCell>
                    <TableCell className="text-right text-slate-500">
                      {formatCurrency(preview.balanceBefore)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-slate-500">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        No elegible
                      </Badge>
                      <div className="text-xs text-slate-400 mt-1">{preview.reason}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">
                {selectedIds.length} de {eligiblePreviews.length} usuarios seleccionados
              </div>
              <div className="text-2xl font-bold text-green-600">
                Total rendimientos: {formatCurrency(totalYield)}
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleExecute}
              disabled={isExecuting || selectedIds.length === 0}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              {isExecuting ? 'Ejecutando...' : 'Ejecutar Cierre'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

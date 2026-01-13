'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { YieldPreview, MonthlyClosure } from '@/types'
import { formatMonthYear } from '@/lib/utils'
import { calculateMonthlyYields, executeMonthlyClose } from '@/lib/actions/rendimientos'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MonthlyCloseForm } from './monthly-close-form'
import { YieldsPreviewTable } from './yields-preview-table'
import { ClosureHistoryTable } from './closure-history-table'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface MonthlyCloseClientProps {
  initialClosures: MonthlyClosure[]
}

export function MonthlyCloseClient({ initialClosures }: MonthlyCloseClientProps) {
  const router = useRouter()
  const [closures] = useState<MonthlyClosure[]>(initialClosures)
  const [previews, setPreviews] = useState<YieldPreview[]>([])
  const [currentParams, setCurrentParams] = useState<{
    year: number
    month: number
    percentage: number
  } | null>(null)

  const [isCalculating, setIsCalculating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleCalculate = async (year: number, month: number, percentage: number) => {
    setIsCalculating(true)
    setError(null)
    setSuccess(null)
    setPreviews([])

    try {
      const result = await calculateMonthlyYields(year, month, percentage)
      setPreviews(result)
      setCurrentParams({ year, month, percentage })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular rendimientos')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleExecute = async (approvedUserIds: string[]) => {
    if (!currentParams) return

    setIsExecuting(true)
    setError(null)

    const result = await executeMonthlyClose(
      currentParams.year,
      currentParams.month,
      currentParams.percentage,
      approvedUserIds
    )

    if (result.error) {
      setError(result.error)
      setIsExecuting(false)
    } else {
      setSuccess(`Cierre de ${formatMonthYear(currentParams.year, currentParams.month)} ejecutado correctamente`)
      setPreviews([])
      setCurrentParams(null)
      setIsExecuting(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cierre Mensual</h1>
        <p className="text-slate-600">Aplicacion de rendimientos mensuales a los usuarios</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <MonthlyCloseForm onCalculate={handleCalculate} isLoading={isCalculating} />

      {previews.length > 0 && currentParams && (
        <YieldsPreviewTable
          key={`${currentParams.year}-${currentParams.month}-${currentParams.percentage}`}
          previews={previews}
          onExecute={handleExecute}
          isExecuting={isExecuting}
          monthLabel={formatMonthYear(currentParams.year, currentParams.month)}
        />
      )}

      <ClosureHistoryTable closures={closures} />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { GUARANTEED_PERCENTAGES } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calculator } from 'lucide-react'

interface MonthlyCloseFormProps {
  onCalculate: (year: number, month: number, percentage: number) => Promise<void>
  isLoading: boolean
}

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

export function MonthlyCloseForm({ onCalculate, isLoading }: MonthlyCloseFormProps) {
  const currentDate = new Date()
  const defaultMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth()
  const defaultYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()

  const [month, setMonth] = useState<number>(defaultMonth)
  const [year, setYear] = useState<number>(defaultYear)
  const [percentage, setPercentage] = useState<number>(GUARANTEED_PERCENTAGES[0])

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCalculate(year, month, percentage)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calcular Rendimientos</CardTitle>
        <CardDescription>
          Selecciona el mes, ano y porcentaje base para calcular los rendimientos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="month">Mes</Label>
              <Select
                value={month.toString()}
                onValueChange={(value) => setMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Select
                value={year.toString()}
                onValueChange={(value) => setYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentaje Base</Label>
              <Select
                value={percentage.toString()}
                onValueChange={(value) => setPercentage(parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GUARANTEED_PERCENTAGES.map((p) => (
                    <SelectItem key={p} value={p.toString()}>
                      {p}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-slate-500">
            Si un usuario tiene un porcentaje garantizado mayor al base, se aplicara el garantizado.
          </div>

          <Button type="submit" disabled={isLoading}>
            <Calculator className="h-4 w-4 mr-2" />
            {isLoading ? 'Calculando...' : 'Calcular Vista Previa'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

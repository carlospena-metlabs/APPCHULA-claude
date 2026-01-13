'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setYieldStartDate } from '@/lib/actions/capital'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Info } from 'lucide-react'

interface SetYieldDateDialogProps {
  userId: string
  currentYieldDate?: string | null
}

export function SetYieldDateDialog({ userId, currentYieldDate }: SetYieldDateDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState(currentYieldDate || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!date) {
      setError('Debes seleccionar una fecha')
      setIsLoading(false)
      return
    }

    const result = await setYieldStartDate(userId, date)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  const selectedDate = date ? new Date(date) : null
  const dayOfMonth = selectedDate ? selectedDate.getDate() : null
  const isBeforeOrOn14 = dayOfMonth !== null && dayOfMonth <= 14

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          {currentYieldDate ? 'Cambiar Fecha Rendimientos' : 'Establecer Fecha Rendimientos'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Fecha de Inicio de Rendimientos</DialogTitle>
            <DialogDescription>
              {currentYieldDate
                ? `Fecha actual: ${formatDate(currentYieldDate)}`
                : 'No hay fecha establecida actualmente.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Reglas de elegibilidad:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>- Si la fecha es dia 1-14: genera rendimiento desde el 15 del mismo mes (50% proporcional)</li>
                  <li>- Si la fecha es dia 15-31: genera rendimiento desde el 1 del mes siguiente</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha de inicio</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {selectedDate && (
              <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Dia del mes:</span>
                  <span className="font-medium">{dayOfMonth}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Rendimiento proporcional:</span>
                  <span className="font-medium">{isBeforeOrOn14 ? 'Si (50%)' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Primer rendimiento completo:</span>
                  <span className="font-medium">
                    {isBeforeOrOn14
                      ? `15 de ${new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(selectedDate)}`
                      : `1 de ${new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
                          new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
                        )}`
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Fecha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

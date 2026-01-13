'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adjustBalance } from '@/lib/actions/capital'
import { formatCurrency } from '@/lib/utils'
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
import { Settings, AlertTriangle } from 'lucide-react'

interface AdjustBalanceDialogProps {
  userId: string
  currentBalance: number
}

export function AdjustBalanceDialog({ userId, currentBalance }: AdjustBalanceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const numAmount = parseFloat(amount)

    if (isNaN(numAmount) || numAmount === 0) {
      setError('El monto no puede ser 0')
      setIsLoading(false)
      return
    }

    if (!reason.trim()) {
      setError('Debes proporcionar una razon para el ajuste')
      setIsLoading(false)
      return
    }

    const result = await adjustBalance(userId, numAmount, reason.trim())

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setOpen(false)
      setAmount('')
      setReason('')
      router.refresh()
    }
  }

  const numAmount = parseFloat(amount) || 0
  const newBalance = currentBalance + numAmount
  const isNegativeResult = newBalance < 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Ajustar Balance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajustar Balance</DialogTitle>
            <DialogDescription>
              Realiza un ajuste manual al balance del usuario. Esta accion quedara registrada en el historial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Los ajustes manuales deben usarse solo para correcciones o situaciones excepcionales.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto del ajuste (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Usar valores negativos para restar"
                required
              />
              <p className="text-sm text-slate-500">
                Usa valores positivos para sumar y negativos para restar.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Razon del ajuste *</Label>
              <Input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Correccion por error de calculo"
                required
              />
            </div>

            {amount && numAmount !== 0 && (
              <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Balance actual:</span>
                  <span>{formatCurrency(currentBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Ajuste:</span>
                  <span className={numAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {numAmount >= 0 ? '+' : ''}{formatCurrency(numAmount)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Nuevo balance:</span>
                  <span className={isNegativeResult ? 'text-red-600' : ''}>
                    {formatCurrency(newBalance)}
                  </span>
                </div>
              </div>
            )}

            {isNegativeResult && (
              <Alert variant="destructive">
                <AlertDescription>
                  El balance resultante seria negativo. Esto no esta permitido.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isNegativeResult}>
              {isLoading ? 'Guardando...' : 'Aplicar Ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

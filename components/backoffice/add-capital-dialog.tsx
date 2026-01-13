'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addCapital } from '@/lib/actions/capital'
import { formatCurrency, MINIMUM_CAPITAL } from '@/lib/utils'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertCircle } from 'lucide-react'

interface AddCapitalDialogProps {
  userId: string
  currentBalance: number
  hasInitialCapital: boolean
}

export function AddCapitalDialog({ userId, currentBalance, hasInitialCapital }: AddCapitalDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'deposito_inicial' | 'incremento'>(
    hasInitialCapital ? 'incremento' : 'deposito_inicial'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const numAmount = parseFloat(amount)

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('El monto debe ser mayor a 0')
      setIsLoading(false)
      return
    }

    const result = await addCapital(userId, numAmount, type)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setOpen(false)
      setAmount('')
      router.refresh()
    }
  }

  const newBalance = currentBalance + (parseFloat(amount) || 0)
  const meetsMinimum = newBalance >= MINIMUM_CAPITAL

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Capital
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Capital</DialogTitle>
            <DialogDescription>
              Balance actual: {formatCurrency(currentBalance)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de movimiento</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as 'deposito_inicial' | 'incremento')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposito_inicial">Deposito Inicial</SelectItem>
                  <SelectItem value="incremento">Incremento</SelectItem>
                </SelectContent>
              </Select>
              {type === 'deposito_inicial' && (
                <p className="text-sm text-slate-500">
                  El deposito inicial suma al capital inicial del usuario.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Balance actual:</span>
                  <span>{formatCurrency(currentBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Monto a agregar:</span>
                  <span className="text-green-600">+{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Nuevo balance:</span>
                  <span>{formatCurrency(newBalance)}</span>
                </div>
              </div>
            )}

            {!meetsMinimum && amount && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El capital minimo para generar rendimientos es {formatCurrency(MINIMUM_CAPITAL)}.
                  El usuario necesita {formatCurrency(MINIMUM_CAPITAL - newBalance)} adicionales.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Agregar Capital'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

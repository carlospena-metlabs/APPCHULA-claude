'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createWithdrawalRequest } from '@/lib/actions/retiros'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const withdrawalSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  type: z.enum(['parcial', 'total']),
})

type WithdrawalFormData = z.infer<typeof withdrawalSchema>

interface WithdrawalFormProps {
  userId: string
  currentBalance: number
  canRequest: boolean
  reason?: string
}

export function WithdrawalForm({
  userId,
  currentBalance,
  canRequest,
  reason,
}: WithdrawalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      type: 'parcial',
    },
  })

  const withdrawalType = watch('type')

  const onSubmit = async (data: WithdrawalFormData) => {
    setIsSubmitting(true)
    try {
      const amount = data.type === 'total' ? currentBalance : data.amount
      const result = await createWithdrawalRequest(userId, amount, data.type)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Solicitud de retiro creada exitosamente')
        reset()
      }
    } catch {
      toast.error('Error al procesar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!canRequest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitar Retiro</CardTitle>
          <CardDescription>
            Crea una nueva solicitud de retiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{reason}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitar Retiro</CardTitle>
        <CardDescription>
          Saldo disponible: {formatCurrency(currentBalance)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de retiro</Label>
            <Select
              value={withdrawalType}
              onValueChange={(value: 'parcial' | 'total') => {
                setValue('type', value)
                if (value === 'total') {
                  setValue('amount', currentBalance)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="total">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={currentBalance}
              disabled={withdrawalType === 'total'}
              {...register('amount', { valueAsNumber: true })}
              placeholder={withdrawalType === 'total' ? formatCurrency(currentBalance) : '0.00'}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
            {withdrawalType === 'total' && (
              <p className="text-sm text-muted-foreground">
                Se retirara el saldo completo: {formatCurrency(currentBalance)}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Solicitar Retiro'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

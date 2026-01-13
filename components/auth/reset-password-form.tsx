'use client'

import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestPasswordReset, resetPassword } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

function SubmitButton({ text, loadingText }: { text: string; loadingText: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? loadingText : text}
    </Button>
  )
}

export function ResetPasswordForm({ hasCode }: { hasCode: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  async function handleRequestReset(formData: FormData) {
    setError(null)
    const result = await requestPasswordReset(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.message || 'Email enviado')
    }
  }

  async function handleResetPassword(formData: FormData) {
    setError(null)
    const result = await resetPassword(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess('Contraseña actualizada')
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Volver al login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (hasCode) {
    return (
      <Card>
        <form action={handleResetPassword}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton text="Cambiar contraseña" loadingText="Cambiando..." />
          </CardFooter>
        </form>
      </Card>
    )
  }

  return (
    <Card>
      <form action={handleRequestReset}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton text="Enviar instrucciones" loadingText="Enviando..." />
          <Link
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Volver al login
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}

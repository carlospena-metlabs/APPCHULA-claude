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
    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={pending}>
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
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <Alert className="bg-primary/10 border-primary/20 text-primary">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted">
              Volver al login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (hasCode) {
    return (
      <Card className="border-border bg-card">
        <form action={handleResetPassword}>
          <CardContent className="space-y-4 pt-6">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Nueva contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                className="bg-muted border-border text-foreground focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                required
                className="bg-muted border-border text-foreground focus:border-primary"
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
    <Card className="border-border bg-card">
      <form action={handleRequestReset}>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton text="Enviar instrucciones" loadingText="Enviando..." />
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Volver al login
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}

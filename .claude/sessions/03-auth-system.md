# Session 03: Authentication System

## Agent: `auth-agent`

## Objective
Implement complete authentication flow with invitation-based registration, login, password reset, and middleware protection.

## Dependencies
- Session 01 completed
- Session 02 completed
- Supabase Auth configured

---

## Tasks

### 3.1 Create Middleware

**middleware.ts**
```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const publicRoutes = ['/login', '/activate', '/reset-password']
const authRoutes = ['/login', '/activate', '/reset-password']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // Redirect logged-in users away from auth pages
    if (user && authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Require authentication for all other routes
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check backoffice access
  if (pathname.startsWith('/backoffice')) {
    // We'll verify admin/operator status in layout
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 3.2 Create Auth Actions

**lib/actions/auth.ts**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

const activateSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

const resetRequestSchema = z.object({
  email: z.string().email('Email inválido'),
})

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validated = loginSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: 'Credenciales inválidas' }
  }

  // Check if user is blocked
  const { data: userData } = await supabase
    .from('users')
    .select('status')
    .eq('email', data.email)
    .single()

  if (userData?.status === 'bloqueado') {
    await supabase.auth.signOut()
    return { error: 'Tu cuenta está bloqueada. Contacta con soporte.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function activateAccount(formData: FormData) {
  const supabase = await createClient()

  const data = {
    token: formData.get('token') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validated = activateSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  // Verify token
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .select('*, user:users(*)')
    .eq('token', data.token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (invError || !invitation) {
    return { error: 'El enlace de invitación es inválido o ha expirado' }
  }

  // Update password in Supabase Auth
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    invitation.user_id,
    { password: data.password }
  )

  if (updateError) {
    return { error: 'Error al establecer la contraseña' }
  }

  // Mark invitation as used
  await supabase
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invitation.id)

  // Update user activated_at
  await supabase
    .from('users')
    .update({ activated_at: new Date().toISOString() })
    .eq('id', invitation.user_id)

  return { success: true }
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
  }

  const validated = resetRequestSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: 'Error al enviar el email de recuperación' }
  }

  return { success: true, message: 'Se ha enviado un email con instrucciones' }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const data = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validated = resetPasswordSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { error } = await supabase.auth.updateUser({
    password: data.password,
  })

  if (error) {
    return { error: 'Error al actualizar la contraseña' }
  }

  return { success: true }
}

export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  return user
}
```

### 3.3 Create Login Page

**app/(auth)/login/page.tsx**
```typescript
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">APPCHULA</h1>
          <p className="text-slate-600 mt-2">Accede a tu cuenta</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
```

**components/auth/login-form.tsx**
```typescript
'use client'

import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { login } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Iniciando sesión...' : 'Iniciar sesión'}
    </Button>
  )
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <Card>
      <form action={handleSubmit}>
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
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton />
          <Link
            href="/reset-password"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
```

### 3.4 Create Activation Page

**app/(auth)/activate/page.tsx**
```typescript
import { ActivateForm } from '@/components/auth/activate-form'

export default function ActivatePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">Enlace inválido</h1>
          <p className="text-slate-600 mt-2">
            El enlace de activación no es válido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Activa tu cuenta</h1>
          <p className="text-slate-600 mt-2">Establece tu contraseña</p>
        </div>
        <ActivateForm token={token} />
      </div>
    </div>
  )
}
```

**components/auth/activate-form.tsx**
```typescript
'use client'

import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { activateAccount } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Activando...' : 'Activar cuenta'}
    </Button>
  )
}

export function ActivateForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    formData.append('token', token)
    const result = await activateAccount(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              ¡Cuenta activada! Redirigiendo al login...
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <form action={handleSubmit}>
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
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  )
}
```

### 3.5 Create Reset Password Page

**app/(auth)/reset-password/page.tsx**
```typescript
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const hasCode = !!searchParams.code

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {hasCode ? 'Nueva contraseña' : 'Recuperar contraseña'}
          </h1>
          <p className="text-slate-600 mt-2">
            {hasCode
              ? 'Establece tu nueva contraseña'
              : 'Te enviaremos un email con instrucciones'}
          </p>
        </div>
        <ResetPasswordForm hasCode={hasCode} />
      </div>
    </div>
  )
}
```

**components/auth/reset-password-form.tsx**
```typescript
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
    const result = await requestPasswordReset(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.message || 'Email enviado')
    }
  }

  async function handleResetPassword(formData: FormData) {
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
```

### 3.6 Create Auth Layout

**app/(auth)/layout.tsx**
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

---

## Files to Create

- [x] `middleware.ts`
- [x] `lib/actions/auth.ts`
- [x] `app/(auth)/layout.tsx`
- [x] `app/(auth)/login/page.tsx`
- [x] `app/(auth)/activate/page.tsx`
- [x] `app/(auth)/reset-password/page.tsx`
- [x] `components/auth/login-form.tsx`
- [x] `components/auth/activate-form.tsx`
- [x] `components/auth/reset-password-form.tsx`

---

## Acceptance Criteria

- [ ] Users can login with email/password
- [ ] Invalid credentials show error message
- [ ] Blocked users cannot login
- [ ] Invitation tokens work for activation
- [ ] Password reset flow works end-to-end
- [ ] Protected routes redirect to login
- [ ] Auth routes redirect logged users to dashboard
- [ ] Session persists across page refreshes

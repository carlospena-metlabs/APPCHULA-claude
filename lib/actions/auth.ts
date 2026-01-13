'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    return { error: validated.error.issues[0].message }
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Audit log - LOGIN_FAILED
    await supabase.from('audit_logs').insert({
      action: 'LOGIN_FAILED',
      entity_type: 'session',
      new_values: { email: data.email, reason: error.message },
    })
    return { error: 'Credenciales inválidas' }
  }

  // Check if user is blocked
  const { data: userData } = await supabase
    .from('users')
    .select('id, status')
    .eq('email', data.email)
    .single()

  if (userData?.status === 'bloqueado') {
    // Audit log - LOGIN_BLOCKED
    await supabase.from('audit_logs').insert({
      user_id: userData.id,
      action: 'LOGIN_BLOCKED',
      entity_type: 'session',
      new_values: { email: data.email, reason: 'user_blocked' },
    })
    await supabase.auth.signOut()
    return { error: 'Tu cuenta está bloqueada. Contacta con soporte.' }
  }

  // Audit log - LOGIN_SUCCESS
  await supabase.from('audit_logs').insert({
    user_id: authData.user?.id,
    action: 'LOGIN_SUCCESS',
    entity_type: 'session',
    new_values: { email: data.email },
  })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function activateAccount(formData: FormData) {
  // Use admin client for activation since user isn't authenticated
  const adminClient = createAdminClient()

  const data = {
    token: formData.get('token') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validated = activateSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Verify token using admin client (bypasses RLS)
  console.log('[Activate] Token recibido:', data.token.substring(0, 10) + '...')

  const { data: invitation, error: invError } = await adminClient
    .from('invitations')
    .select('*, user:users!user_id(*)')
    .eq('token', data.token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  console.log('[Activate] Resultado query:', { invitation: !!invitation, error: invError?.message })

  if (invError || !invitation) {
    // Debug: check if token exists at all
    const { data: anyInvitation, error: debugError } = await adminClient
      .from('invitations')
      .select('id, used_at, expires_at')
      .eq('token', data.token)
      .single()

    console.log('[Activate] Debug query:', { anyInvitation, debugError: debugError?.message })

    if (!anyInvitation) {
      return { error: 'Token no encontrado. Solicita un nuevo enlace de activacion.' }
    }
    if (anyInvitation.used_at) {
      return { error: 'Este enlace ya fue utilizado. Inicia sesion o solicita un nuevo enlace.' }
    }
    if (new Date(anyInvitation.expires_at) < new Date()) {
      return { error: 'El enlace ha expirado. Solicita un nuevo enlace de activacion.' }
    }
    return { error: 'El enlace de invitacion es invalido o ha expirado' }
  }

  // Update password in Supabase Auth using admin client
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    invitation.user_id,
    { password: data.password }
  )

  if (updateError) {
    return { error: 'Error al establecer la contraseña' }
  }

  // Mark invitation as used
  await adminClient
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invitation.id)

  // Update user activated_at
  await adminClient
    .from('users')
    .update({ activated_at: new Date().toISOString() })
    .eq('id', invitation.user_id)

  // Audit log - ACCOUNT_ACTIVATED
  await adminClient.from('audit_logs').insert({
    user_id: invitation.user_id,
    action: 'ACCOUNT_ACTIVATED',
    entity_type: 'user',
    entity_id: invitation.user_id,
    new_values: { activated_at: new Date().toISOString() },
  })

  return { success: true }
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
  }

  const validated = resetRequestSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
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
    return { error: validated.error.issues[0].message }
  }

  // Get current user for audit
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { error } = await supabase.auth.updateUser({
    password: data.password,
  })

  if (error) {
    return { error: 'Error al actualizar la contraseña' }
  }

  // Audit log - PASSWORD_CHANGED
  await supabase.from('audit_logs').insert({
    user_id: currentUser?.id,
    action: 'PASSWORD_CHANGED',
    entity_type: 'user',
    entity_id: currentUser?.id,
  })

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

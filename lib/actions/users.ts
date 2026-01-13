'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { UserType, UserStatus } from '@/types'
import { GUARANTEED_PERCENTAGES } from '@/lib/utils'
import { randomBytes } from 'crypto'

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  user_type: z.enum(['cliente', 'agente', 'super_agente']),
  guaranteed_percentage: z.number().refine(
    (val) => GUARANTEED_PERCENTAGES.includes(val as typeof GUARANTEED_PERCENTAGES[number]),
    { message: 'Porcentaje no válido' }
  ),
  agent_id: z.string().uuid().optional().nullable(),
  super_agent_id: z.string().uuid().optional().nullable(),
  initial_capital: z.number().min(0).default(0),
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  phone: z.string().optional(),
  user_type: z.enum(['cliente', 'agente', 'super_agente']).optional(),
  guaranteed_percentage: z.number().refine(
    (val) => GUARANTEED_PERCENTAGES.includes(val as typeof GUARANTEED_PERCENTAGES[number]),
    { message: 'Porcentaje no válido' }
  ).optional(),
  agent_id: z.string().uuid().optional().nullable(),
  super_agent_id: z.string().uuid().optional().nullable(),
})

export async function getUsers(filters?: {
  type?: UserType
  status?: UserStatus
  search?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('users')
    .select(`
      *,
      agent:agent_id(id, full_name, email),
      super_agent:super_agent_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (filters?.type) {
    query = query.eq('user_type', filters.type)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data
}

export async function getUser(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      agent:agent_id(id, full_name, email),
      super_agent:super_agent_id(id, full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createUser(formData: FormData) {
  const adminClient = createAdminClient()

  const agentId = formData.get('agent_id') as string
  const superAgentId = formData.get('super_agent_id') as string

  const data = {
    email: formData.get('email') as string,
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string || undefined,
    user_type: formData.get('user_type') as UserType,
    guaranteed_percentage: parseFloat(formData.get('guaranteed_percentage') as string),
    agent_id: agentId && agentId !== 'none' ? agentId : null,
    super_agent_id: superAgentId && superAgentId !== 'none' ? superAgentId : null,
    initial_capital: parseFloat(formData.get('initial_capital') as string) || 0,
  }

  const validated = createUserSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Create user in Supabase Auth using admin client
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  })

  if (authError) {
    return { error: 'Error al crear usuario: ' + authError.message }
  }

  // Create user in public.users
  const { error: insertError } = await adminClient
    .from('users')
    .insert({
      id: authUser.user.id,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      user_type: data.user_type,
      guaranteed_percentage: data.guaranteed_percentage,
      agent_id: data.agent_id,
      super_agent_id: data.super_agent_id,
      initial_capital: data.initial_capital,
      current_balance: data.initial_capital,
    })

  if (insertError) {
    // Cleanup auth user
    await adminClient.auth.admin.deleteUser(authUser.user.id)
    return { error: 'Error al crear perfil: ' + insertError.message }
  }

  // Get current admin user for audit
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: currentUser?.id,
    action: 'CREATE_USER',
    entity_type: 'user',
    entity_id: authUser.user.id,
    new_values: {
      email: data.email,
      full_name: data.full_name,
      user_type: data.user_type,
      guaranteed_percentage: data.guaranteed_percentage,
      initial_capital: data.initial_capital,
    },
  })

  revalidatePath('/backoffice/usuarios')
  return { success: true, userId: authUser.user.id }
}

export async function updateUser(formData: FormData) {
  const supabase = await createClient()

  const agentIdVal = formData.get('agent_id') as string
  const superAgentIdVal = formData.get('super_agent_id') as string

  const data = {
    id: formData.get('id') as string,
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string || undefined,
    user_type: formData.get('user_type') as UserType,
    guaranteed_percentage: parseFloat(formData.get('guaranteed_percentage') as string),
    agent_id: agentIdVal && agentIdVal !== 'none' ? agentIdVal : null,
    super_agent_id: superAgentIdVal && superAgentIdVal !== 'none' ? superAgentIdVal : null,
  }

  const validated = updateUserSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Get old values for audit
  const { data: oldUser } = await supabase
    .from('users')
    .select('full_name, phone, user_type, guaranteed_percentage, agent_id, super_agent_id')
    .eq('id', data.id)
    .single()

  const { error } = await supabase
    .from('users')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      user_type: data.user_type,
      guaranteed_percentage: data.guaranteed_percentage,
      agent_id: data.agent_id,
      super_agent_id: data.super_agent_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (error) {
    return { error: 'Error al actualizar: ' + error.message }
  }

  // Get current admin user for audit
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: currentUser?.id,
    action: 'UPDATE_USER',
    entity_type: 'user',
    entity_id: data.id,
    old_values: oldUser,
    new_values: {
      full_name: data.full_name,
      phone: data.phone,
      user_type: data.user_type,
      guaranteed_percentage: data.guaranteed_percentage,
      agent_id: data.agent_id,
      super_agent_id: data.super_agent_id,
    },
  })

  revalidatePath('/backoffice/usuarios')
  revalidatePath(`/backoffice/usuarios/${data.id}`)
  return { success: true }
}

export async function blockUser(userId: string) {
  const supabase = await createClient()

  // Get old status for audit
  const { data: oldUser } = await supabase
    .from('users')
    .select('status')
    .eq('id', userId)
    .single()

  const { error } = await supabase
    .from('users')
    .update({ status: 'bloqueado', updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    return { error: 'Error al bloquear usuario' }
  }

  // Get current admin user for audit
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: currentUser?.id,
    action: 'BLOCK_USER',
    entity_type: 'user',
    entity_id: userId,
    old_values: { status: oldUser?.status },
    new_values: { status: 'bloqueado' },
  })

  revalidatePath('/backoffice/usuarios')
  return { success: true }
}

export async function unblockUser(userId: string) {
  const supabase = await createClient()

  // Get old status for audit
  const { data: oldUser } = await supabase
    .from('users')
    .select('status')
    .eq('id', userId)
    .single()

  const { error } = await supabase
    .from('users')
    .update({ status: 'activo', updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    return { error: 'Error al desbloquear usuario' }
  }

  // Get current admin user for audit
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: currentUser?.id,
    action: 'UNBLOCK_USER',
    entity_type: 'user',
    entity_id: userId,
    old_values: { status: oldUser?.status },
    new_values: { status: 'activo' },
  })

  revalidatePath('/backoffice/usuarios')
  return { success: true }
}

export async function sendInvitation(userId: string) {
  const adminClient = createAdminClient()

  // Get user info
  const { data: user, error: userError } = await adminClient
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return { error: 'Usuario no encontrado' }
  }

  // Generate token
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  // Invalidate previous invitations
  await adminClient
    .from('invitations')
    .delete()
    .eq('user_id', userId)
    .is('used_at', null)

  // Create new invitation
  const { error } = await adminClient
    .from('invitations')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    return { error: 'Error al crear invitación' }
  }

  // Get current admin user for audit
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: currentUser?.id,
    action: 'SEND_INVITATION',
    entity_type: 'invitation',
    entity_id: userId,
    new_values: {
      email: user.email,
      expires_at: expiresAt.toISOString(),
    },
  })

  // TODO: Send email with Resend
  // For now, return the activation URL
  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${token}`

  return { success: true, activationUrl }
}

export async function getAgents() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('user_type', 'agente')
    .eq('status', 'activo')

  if (error) return []
  return data
}

export async function getSuperAgents() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('user_type', 'super_agente')
    .eq('status', 'activo')

  if (error) return []
  return data
}

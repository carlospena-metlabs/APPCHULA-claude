'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { WithdrawalType } from '@/types'
import { WITHDRAWAL_WINDOWS, WITHDRAWAL_ADVANCE_DAYS, MINIMUM_MONTHS_FOR_WITHDRAWAL } from '@/lib/utils'

const withdrawalRequestSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  type: z.enum(['parcial', 'total']),
})

export interface WithdrawalWindowInfo {
  window: Date
  windowFormatted: string
  isOpen: boolean
  daysRemaining: number
  openDate: Date
  closeDate: Date
}

export interface WithdrawalEligibility {
  canRequest: boolean
  reason?: string
  windowInfo: WithdrawalWindowInfo
}

export async function getNextWithdrawalWindow(): Promise<WithdrawalWindowInfo> {
  const now = new Date()
  const currentYear = now.getFullYear()

  // Parse windows into dates for current and next year
  const allWindows: Date[] = []

  for (const w of WITHDRAWAL_WINDOWS) {
    const [month, day] = w.split('-').map(Number)
    allWindows.push(new Date(currentYear, month - 1, day))
    allWindows.push(new Date(currentYear + 1, month - 1, day))
  }

  // Sort windows chronologically
  allWindows.sort((a, b) => a.getTime() - b.getTime())

  // Find next window that hasn't passed
  let nextWindow = allWindows.find(w => w >= now)

  if (!nextWindow) {
    // Fallback to first window of next year
    const [month, day] = WITHDRAWAL_WINDOWS[0].split('-').map(Number)
    nextWindow = new Date(currentYear + 2, month - 1, day)
  }

  // Calculate open date (10 days before window)
  const openDate = new Date(nextWindow)
  openDate.setDate(openDate.getDate() - WITHDRAWAL_ADVANCE_DAYS)

  // Check if window is currently open
  const isOpen = now >= openDate && now <= nextWindow

  // Calculate days remaining
  let daysRemaining: number
  if (isOpen) {
    // Days until window closes
    daysRemaining = Math.ceil((nextWindow.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  } else if (now < openDate) {
    // Days until window opens
    daysRemaining = Math.ceil((openDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  } else {
    // Window passed, find next
    daysRemaining = 0
  }

  const windowFormatted = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(nextWindow)

  return {
    window: nextWindow,
    windowFormatted,
    isOpen,
    daysRemaining,
    openDate,
    closeDate: nextWindow,
  }
}

export async function canRequestWithdrawal(userId: string): Promise<WithdrawalEligibility> {
  const supabase = await createClient()
  const windowInfo = await getNextWithdrawalWindow()

  // Fetch user data
  const { data: user, error } = await supabase
    .from('users')
    .select('status, yield_start_date, current_balance')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return {
      canRequest: false,
      reason: 'No se pudo obtener información del usuario',
      windowInfo,
    }
  }

  // Check if user is blocked
  if (user.status === 'bloqueado') {
    return {
      canRequest: false,
      reason: 'Tu cuenta está bloqueada. No puedes solicitar retiros.',
      windowInfo,
    }
  }

  // Check if withdrawal window is open
  if (!windowInfo.isOpen) {
    return {
      canRequest: false,
      reason: `La ventana de retiros no está abierta. Se abrirá ${windowInfo.daysRemaining} días antes del ${windowInfo.windowFormatted}.`,
      windowInfo,
    }
  }

  // Check minimum seniority (3 months from yield start date)
  if (!user.yield_start_date) {
    return {
      canRequest: false,
      reason: 'Tu cuenta aún no ha comenzado a generar rendimientos.',
      windowInfo,
    }
  }

  const yieldStartDate = new Date(user.yield_start_date)
  const now = new Date()
  const monthsDiff = (now.getFullYear() - yieldStartDate.getFullYear()) * 12 +
                     (now.getMonth() - yieldStartDate.getMonth())

  if (monthsDiff < MINIMUM_MONTHS_FOR_WITHDRAWAL) {
    return {
      canRequest: false,
      reason: `Debes tener al menos ${MINIMUM_MONTHS_FOR_WITHDRAWAL} meses de antigüedad para solicitar retiros. Actualmente tienes ${monthsDiff} meses.`,
      windowInfo,
    }
  }

  // Check if user has balance
  if (user.current_balance <= 0) {
    return {
      canRequest: false,
      reason: 'No tienes saldo disponible para retirar.',
      windowInfo,
    }
  }

  // Check if there's already a pending withdrawal for this window
  const { data: pendingWithdrawal } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'solicitado')
    .single()

  if (pendingWithdrawal) {
    return {
      canRequest: false,
      reason: 'Ya tienes una solicitud de retiro pendiente.',
      windowInfo,
    }
  }

  return {
    canRequest: true,
    windowInfo,
  }
}

export async function createWithdrawalRequest(
  userId: string,
  amount: number,
  type: WithdrawalType
) {
  const supabase = await createClient()

  // Validate input
  const validated = withdrawalRequestSchema.safeParse({ userId, amount, type })
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Check eligibility
  const eligibility = await canRequestWithdrawal(userId)
  if (!eligibility.canRequest) {
    return { error: eligibility.reason }
  }

  // Get user balance
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('current_balance')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return { error: 'No se pudo obtener información del usuario' }
  }

  // Validate amount
  if (amount > user.current_balance) {
    return { error: 'El monto solicitado excede tu saldo disponible' }
  }

  // For total withdrawal, use the full balance
  const withdrawalAmount = type === 'total' ? user.current_balance : amount

  // Format the withdrawal window date
  const windowDate = eligibility.windowInfo.window.toISOString().split('T')[0]

  // Create withdrawal request
  const { data: withdrawal, error: insertError } = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      amount: withdrawalAmount,
      type,
      status: 'solicitado',
      withdrawal_window: windowDate,
      requested_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (insertError) {
    return { error: 'Error al crear la solicitud: ' + insertError.message }
  }

  revalidatePath('/dashboard/retiros')
  return { success: true, withdrawal }
}

// ==================== ADMIN ACTIONS ====================

export async function getAllWithdrawals(status?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('withdrawals')
    .select('*, user:user_id(id, full_name, email, current_balance)')
    .order('requested_at', { ascending: false })

  if (status && status !== 'todos') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return []
  return data
}

export async function getWithdrawalStats() {
  const supabase = await createClient()

  const { data: pending } = await supabase
    .from('withdrawals')
    .select('amount')
    .eq('status', 'solicitado')

  const { data: approved } = await supabase
    .from('withdrawals')
    .select('amount')
    .eq('status', 'aprobado')

  return {
    pendingCount: pending?.length || 0,
    pendingAmount: pending?.reduce((sum, w) => sum + w.amount, 0) || 0,
    approvedCount: approved?.length || 0,
    approvedAmount: approved?.reduce((sum, w) => sum + w.amount, 0) || 0,
  }
}

export async function approveWithdrawal(withdrawalId: string) {
  const supabase = await createClient()

  // Get current admin user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return { error: 'No autenticado' }
  }

  const { data: admin } = await supabase
    .from('users')
    .select('id, is_admin, is_operator')
    .eq('id', authUser.id)
    .single()

  if (!admin?.is_admin && !admin?.is_operator) {
    return { error: 'No autorizado' }
  }

  // Update withdrawal status
  const { error } = await supabase
    .from('withdrawals')
    .update({
      status: 'aprobado',
      approved_at: new Date().toISOString(),
      approved_by: admin.id,
    })
    .eq('id', withdrawalId)
    .eq('status', 'solicitado')

  if (error) {
    return { error: 'Error al aprobar: ' + error.message }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: 'APPROVE_WITHDRAWAL',
    entity_type: 'withdrawal',
    entity_id: withdrawalId,
  })

  revalidatePath('/backoffice/retiros')
  return { success: true }
}

export async function executeWithdrawal(withdrawalId: string) {
  const supabase = await createClient()

  // Get current admin user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return { error: 'No autenticado' }
  }

  const { data: admin } = await supabase
    .from('users')
    .select('id, is_admin, is_operator')
    .eq('id', authUser.id)
    .single()

  if (!admin?.is_admin && !admin?.is_operator) {
    return { error: 'No autorizado' }
  }

  // Get withdrawal with user
  const { data: withdrawal, error: fetchError } = await supabase
    .from('withdrawals')
    .select('*, user:user_id(*)')
    .eq('id', withdrawalId)
    .eq('status', 'aprobado')
    .single()

  if (fetchError || !withdrawal) {
    return { error: 'Retiro no encontrado o no está aprobado' }
  }

  const user = withdrawal.user as { id: string; current_balance: number }
  const balanceBefore = user.current_balance
  const balanceAfter = balanceBefore - withdrawal.amount

  if (balanceAfter < 0) {
    return { error: 'Balance insuficiente para ejecutar el retiro' }
  }

  // Update withdrawal status
  const { error: updateError } = await supabase
    .from('withdrawals')
    .update({
      status: 'ejecutado',
      executed_at: new Date().toISOString(),
      executed_by: admin.id,
    })
    .eq('id', withdrawalId)

  if (updateError) {
    return { error: 'Error al actualizar retiro: ' + updateError.message }
  }

  // Update user balance
  const { error: balanceError } = await supabase
    .from('users')
    .update({
      current_balance: balanceAfter,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (balanceError) {
    return { error: 'Error al actualizar balance: ' + balanceError.message }
  }

  // Record capital movement
  await supabase.from('capital_movements').insert({
    user_id: user.id,
    type: 'retiro',
    amount: -withdrawal.amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description: `Retiro ${withdrawal.type} - Ventana ${withdrawal.withdrawal_window}`,
    executed_by: admin.id,
  })

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: 'EXECUTE_WITHDRAWAL',
    entity_type: 'withdrawal',
    entity_id: withdrawalId,
    old_values: { balance: balanceBefore },
    new_values: { balance: balanceAfter, amount: withdrawal.amount },
  })

  revalidatePath('/backoffice/retiros')
  revalidatePath('/backoffice/usuarios')
  return { success: true }
}

export async function rejectWithdrawal(withdrawalId: string, reason: string) {
  const supabase = await createClient()

  // Get current admin user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return { error: 'No autenticado' }
  }

  const { data: admin } = await supabase
    .from('users')
    .select('id, is_admin, is_operator')
    .eq('id', authUser.id)
    .single()

  if (!admin?.is_admin && !admin?.is_operator) {
    return { error: 'No autorizado' }
  }

  if (!reason || reason.trim().length === 0) {
    return { error: 'Debes proporcionar un motivo de rechazo' }
  }

  const { error } = await supabase
    .from('withdrawals')
    .update({
      status: 'rechazado',
      rejected_at: new Date().toISOString(),
      rejected_by: admin.id,
      notes: reason,
    })
    .eq('id', withdrawalId)
    .eq('status', 'solicitado')

  if (error) {
    return { error: 'Error al rechazar: ' + error.message }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: 'REJECT_WITHDRAWAL',
    entity_type: 'withdrawal',
    entity_id: withdrawalId,
    new_values: { reason },
  })

  revalidatePath('/backoffice/retiros')
  return { success: true }
}

export async function getMyWithdrawals(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })

  if (error) return []
  return data
}

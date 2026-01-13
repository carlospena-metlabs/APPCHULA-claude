'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'

export async function addCapital(userId: string, amount: number, type: 'deposito_inicial' | 'incremento') {
  const supabase = await createClient()
  const admin = await getCurrentUser()

  if (!admin?.is_admin) {
    return { error: 'No tienes permisos para realizar esta accion' }
  }

  if (amount <= 0) {
    return { error: 'El monto debe ser mayor a 0' }
  }

  // Get current balance
  const { data: user } = await supabase
    .from('users')
    .select('current_balance, initial_capital')
    .eq('id', userId)
    .single()

  if (!user) {
    return { error: 'Usuario no encontrado' }
  }

  const balanceBefore = user.current_balance
  const balanceAfter = balanceBefore + amount

  // Update user balance
  const updateData: Record<string, unknown> = {
    current_balance: balanceAfter,
    updated_at: new Date().toISOString(),
  }

  if (type === 'deposito_inicial') {
    updateData.initial_capital = user.initial_capital + amount
  }

  const { error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)

  if (updateError) {
    return { error: 'Error al actualizar balance' }
  }

  // Record movement
  const { error: movementError } = await supabase.from('capital_movements').insert({
    user_id: userId,
    type,
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    executed_by: admin.id,
  })

  if (movementError) {
    console.error('Error recording movement:', movementError)
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: type === 'deposito_inicial' ? 'ADD_INITIAL_CAPITAL' : 'ADD_CAPITAL_INCREMENT',
    entity_type: 'user',
    entity_id: userId,
    new_values: { amount, balance_after: balanceAfter },
  })

  revalidatePath('/backoffice/usuarios')
  revalidatePath(`/backoffice/usuarios/${userId}`)
  return { success: true }
}

export async function adjustBalance(userId: string, amount: number, reason: string) {
  const supabase = await createClient()
  const admin = await getCurrentUser()

  if (!admin?.is_admin) {
    return { error: 'No tienes permisos para realizar esta accion' }
  }

  if (!reason.trim()) {
    return { error: 'Debes proporcionar una razon para el ajuste' }
  }

  const { data: user } = await supabase
    .from('users')
    .select('current_balance')
    .eq('id', userId)
    .single()

  if (!user) {
    return { error: 'Usuario no encontrado' }
  }

  const balanceBefore = user.current_balance
  const balanceAfter = balanceBefore + amount

  if (balanceAfter < 0) {
    return { error: 'El balance no puede ser negativo' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      current_balance: balanceAfter,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    return { error: 'Error al ajustar balance' }
  }

  // Record movement (using incremento type with description for adjustments)
  await supabase.from('capital_movements').insert({
    user_id: userId,
    type: amount >= 0 ? 'incremento' : 'retiro',
    amount: Math.abs(amount),
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description: `[AJUSTE] ${reason}`,
    executed_by: admin.id,
  })

  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: 'BALANCE_ADJUSTMENT',
    entity_type: 'user',
    entity_id: userId,
    old_values: { balance: balanceBefore },
    new_values: { balance: balanceAfter, reason },
  })

  revalidatePath('/backoffice/usuarios')
  revalidatePath(`/backoffice/usuarios/${userId}`)
  return { success: true }
}

export async function getCapitalMovements(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('capital_movements')
    .select('*, executed_by_user:executed_by(full_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function setYieldStartDate(userId: string, date: string) {
  const supabase = await createClient()
  const admin = await getCurrentUser()

  if (!admin?.is_admin) {
    return { error: 'No tienes permisos para realizar esta accion' }
  }

  // Get current yield_start_date for audit
  const { data: user } = await supabase
    .from('users')
    .select('yield_start_date')
    .eq('id', userId)
    .single()

  const { error } = await supabase
    .from('users')
    .update({
      yield_start_date: date,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    return { error: 'Error al establecer fecha' }
  }

  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: 'SET_YIELD_START_DATE',
    entity_type: 'user',
    entity_id: userId,
    old_values: { yield_start_date: user?.yield_start_date },
    new_values: { yield_start_date: date },
  })

  revalidatePath(`/backoffice/usuarios/${userId}`)
  return { success: true }
}

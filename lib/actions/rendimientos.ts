'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { MINIMUM_CAPITAL } from '@/lib/utils'
import { YieldPreview, MonthlyClosure } from '@/types'

export async function calculateMonthlyYields(
  year: number,
  month: number,
  basePercentage: number
): Promise<YieldPreview[]> {
  const supabase = await createClient()

  // Check if closure already exists
  const { data: existingClosure } = await supabase
    .from('monthly_closures')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('status', 'executed')
    .single()

  if (existingClosure) {
    throw new Error('Este mes ya ha sido cerrado')
  }

  // Get eligible users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'activo')
    .in('user_type', ['cliente', 'agente', 'super_agente'])
    .gt('current_balance', 0)

  if (error || !users) return []

  const previews: YieldPreview[] = []

  for (const user of users) {
    const preview: YieldPreview = {
      userId: user.id,
      fullName: user.full_name,
      email: user.email,
      balanceBefore: user.current_balance,
      guaranteedPercentage: user.guaranteed_percentage,
      percentageToApply: 0,
      yieldAmount: 0,
      balanceAfter: user.current_balance,
      isEligible: true,
      isProportional: false,
    }

    // Check minimum capital
    if (user.current_balance < MINIMUM_CAPITAL) {
      preview.isEligible = false
      preview.reason = `Balance menor a ${MINIMUM_CAPITAL.toLocaleString()} USD`
      previews.push(preview)
      continue
    }

    // Check yield start date
    if (!user.yield_start_date) {
      preview.isEligible = false
      preview.reason = 'Sin fecha de inicio de rendimientos'
      previews.push(preview)
      continue
    }

    const yieldStartDate = new Date(user.yield_start_date)
    const closureDate = new Date(year, month - 1, 1)

    if (yieldStartDate > closureDate) {
      preview.isEligible = false
      preview.reason = 'Aun no ha comenzado a generar rendimientos'
      previews.push(preview)
      continue
    }

    // Check if first month (proportional)
    const yieldStartMonth = yieldStartDate.getMonth() + 1
    const yieldStartYear = yieldStartDate.getFullYear()
    const isFirstMonth = yieldStartYear === year && yieldStartMonth === month

    if (isFirstMonth && yieldStartDate.getDate() >= 15) {
      preview.isProportional = true
    }

    // Determine percentage to apply
    const effectivePercentage = Math.max(basePercentage, user.guaranteed_percentage)
    preview.percentageToApply = preview.isProportional
      ? effectivePercentage / 2
      : effectivePercentage

    // Calculate yield
    preview.yieldAmount = Math.round(
      (user.current_balance * preview.percentageToApply / 100) * 100
    ) / 100
    preview.balanceAfter = Math.round(
      (user.current_balance + preview.yieldAmount) * 100
    ) / 100

    previews.push(preview)
  }

  return previews
}

export async function executeMonthlyClose(
  year: number,
  month: number,
  basePercentage: number,
  approvedUserIds: string[]
): Promise<{ success?: boolean; error?: string; closure?: MonthlyClosure }> {
  const supabase = await createClient()
  const admin = await getCurrentUser()

  if (!admin?.is_admin) {
    return { error: 'No autorizado' }
  }

  // Get previews for approved users only
  const previews = await calculateMonthlyYields(year, month, basePercentage)
  const approvedPreviews = previews.filter(
    p => p.isEligible && approvedUserIds.includes(p.userId)
  )

  if (approvedPreviews.length === 0) {
    return { error: 'No hay usuarios aprobados para el cierre' }
  }

  // Create closure record
  const { data: closure, error: closureError } = await supabase
    .from('monthly_closures')
    .insert({
      year,
      month,
      percentage: basePercentage,
      status: 'executed',
      total_users_affected: approvedPreviews.length,
      total_yield_amount: approvedPreviews.reduce((sum, p) => sum + p.yieldAmount, 0),
      executed_by: admin.id,
      executed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (closureError) {
    return { error: 'Error al crear cierre: ' + closureError.message }
  }

  // Apply yields to each user
  for (const preview of approvedPreviews) {
    // Update balance
    await supabase
      .from('users')
      .update({
        current_balance: preview.balanceAfter,
        updated_at: new Date().toISOString(),
      })
      .eq('id', preview.userId)

    // Create yield record
    await supabase.from('monthly_yields').insert({
      user_id: preview.userId,
      year,
      month,
      percentage_applied: preview.percentageToApply,
      yield_amount: preview.yieldAmount,
      balance_before: preview.balanceBefore,
      balance_after: preview.balanceAfter,
      is_proportional: preview.isProportional,
      executed_by: admin.id,
    })

    // Create capital movement
    await supabase.from('capital_movements').insert({
      user_id: preview.userId,
      type: 'rendimiento',
      amount: preview.yieldAmount,
      balance_before: preview.balanceBefore,
      balance_after: preview.balanceAfter,
      description: `Rendimiento ${month}/${year} (${preview.percentageToApply}%)`,
      executed_by: admin.id,
    })
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: admin.id,
    action: 'EXECUTE_MONTHLY_CLOSE',
    entity_type: 'monthly_closure',
    entity_id: closure.id,
    new_values: {
      year,
      month,
      percentage: basePercentage,
      users_affected: approvedPreviews.length,
      total_yield: approvedPreviews.reduce((sum, p) => sum + p.yieldAmount, 0),
    },
  })

  revalidatePath('/backoffice/cierre-mensual')
  revalidatePath('/backoffice/usuarios')
  return { success: true, closure }
}

export async function getClosureHistory(): Promise<MonthlyClosure[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('monthly_closures')
    .select('*, executed_by_user:executed_by(full_name)')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) return []
  return data as MonthlyClosure[]
}

export async function getYieldsHistory(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('monthly_yields')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) return []
  return data
}

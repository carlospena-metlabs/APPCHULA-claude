'use server'

import { createClient } from '@/lib/supabase/server'
import { User, MonthlyYield, Withdrawal } from '@/types'

export interface CapitalMovement {
  id: string
  user_id: string
  type: 'deposito_inicial' | 'incremento' | 'retiro' | 'comision_entrada' | 'comision_salida'
  amount: number
  balance_before: number
  balance_after: number
  description?: string
  executed_by?: string
  created_at: string
}

export interface BalanceHistoryPoint {
  month: string
  balance: number
  yield: number
}

export interface DashboardData {
  user: User
  totalYields: number
  balanceHistory: BalanceHistoryPoint[]
}

export async function getClientDashboard(userId: string): Promise<DashboardData> {
  const supabase = await createClient()

  // Fetch user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) throw new Error(userError.message)

  // Fetch monthly yields for total and history
  const { data: yields, error: yieldsError } = await supabase
    .from('monthly_yields')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: true })
    .order('month', { ascending: true })

  if (yieldsError) throw new Error(yieldsError.message)

  // Calculate total yields
  const totalYields = (yields || []).reduce((sum, y) => sum + y.yield_amount, 0)

  // Build balance history for chart
  const balanceHistory: BalanceHistoryPoint[] = (yields || []).map((y) => ({
    month: formatMonthShort(y.year, y.month),
    balance: y.balance_after,
    yield: y.yield_amount,
  }))

  // Add initial balance point if we have history
  if (balanceHistory.length > 0 && yields && yields.length > 0) {
    const firstYield = yields[0]
    balanceHistory.unshift({
      month: 'Inicio',
      balance: firstYield.balance_before,
      yield: 0,
    })
  }

  return {
    user,
    totalYields,
    balanceHistory,
  }
}

export async function getMonthlyYields(
  userId: string,
  options?: { year?: number }
): Promise<MonthlyYield[]> {
  const supabase = await createClient()

  let query = supabase
    .from('monthly_yields')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (options?.year) {
    query = query.eq('year', options.year)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data || []
}

export async function getCapitalMovements(userId: string): Promise<CapitalMovement[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('capital_movements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getWithdrawals(userId: string): Promise<Withdrawal[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

function formatMonthShort(year: number, month: number): string {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${months[month - 1]} ${year}`
}

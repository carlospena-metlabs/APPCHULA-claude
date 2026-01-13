export type UserType = 'cliente' | 'agente' | 'super_agente'
export type UserStatus = 'activo' | 'no_verificado' | 'bloqueado'
export type WithdrawalStatus = 'solicitado' | 'aprobado' | 'ejecutado' | 'rechazado'
export type WithdrawalType = 'parcial' | 'total'
export type CommissionStatus = 'pendiente' | 'acreditada'
export type CapitalMovementType = 'deposito_inicial' | 'incremento' | 'retiro' | 'rendimiento' | 'comision_entrada' | 'comision_salida'
export type MonthlyClosureStatus = 'pending' | 'executed'

export interface User {
  id: string
  email: string
  phone?: string
  full_name: string
  user_type: UserType
  status: UserStatus
  agent_id?: string
  super_agent_id?: string
  is_admin: boolean
  is_operator: boolean
  initial_capital: number
  current_balance: number
  guaranteed_percentage: number
  yield_start_date?: string
  created_at: string
  updated_at: string
  activated_at?: string
}

export interface MonthlyYield {
  id: string
  user_id: string
  year: number
  month: number
  percentage_applied: number
  yield_amount: number
  balance_before: number
  balance_after: number
  is_proportional: boolean
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  type: WithdrawalType
  status: WithdrawalStatus
  withdrawal_window: string
  requested_at: string
  approved_at?: string
  executed_at?: string
  notes?: string
}

export interface WithdrawalWithUser extends Withdrawal {
  user: {
    id: string
    full_name: string
    email: string
    current_balance: number
  }
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  created_at: string
}

export interface CapitalMovement {
  id: string
  user_id: string
  type: CapitalMovementType
  amount: number
  balance_before: number
  balance_after: number
  description?: string
  executed_by?: string
  executed_by_user?: { full_name: string }
  created_at: string
}

export interface MonthlyClosure {
  id: string
  year: number
  month: number
  percentage: number
  status: MonthlyClosureStatus
  total_users_affected: number
  total_yield_amount: number
  executed_by?: string
  executed_by_user?: { full_name: string }
  executed_at?: string
  created_at: string
}

export interface YieldPreview {
  userId: string
  fullName: string
  email: string
  balanceBefore: number
  guaranteedPercentage: number
  percentageToApply: number
  yieldAmount: number
  balanceAfter: number
  isEligible: boolean
  reason?: string
  isProportional: boolean
}

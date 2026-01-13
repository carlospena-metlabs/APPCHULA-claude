# Session 08: Withdrawals System

## Agent: `fullstack-agent`

## Objective
Implement the withdrawal request and management system with quarterly windows, validation, and approval workflow.

## Dependencies
- Session 07 completed

---

## Tasks

### 8.1 Create Withdrawal Actions

**lib/actions/retiros.ts**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import {
  WITHDRAWAL_WINDOWS,
  WITHDRAWAL_ADVANCE_DAYS,
  MINIMUM_MONTHS_FOR_WITHDRAWAL,
} from '@/lib/utils'

function getNextWithdrawalWindow(): Date | null {
  const now = new Date()
  const currentYear = now.getFullYear()

  const windows = WITHDRAWAL_WINDOWS.map(w => {
    const [month, day] = w.split('-').map(Number)
    return new Date(currentYear, month - 1, day)
  })

  // Add next year's first window
  windows.push(new Date(currentYear + 1, 2, 31)) // March 31

  for (const window of windows) {
    const deadline = new Date(window)
    deadline.setDate(deadline.getDate() - WITHDRAWAL_ADVANCE_DAYS)

    if (now <= deadline) {
      return window
    }
  }

  return null
}

function canRequestWithdrawal(yieldStartDate: string | null): {
  allowed: boolean
  reason?: string
} {
  if (!yieldStartDate) {
    return { allowed: false, reason: 'No has comenzado a generar rendimientos' }
  }

  const startDate = new Date(yieldStartDate)
  const now = new Date()
  const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())

  if (monthsDiff < MINIMUM_MONTHS_FOR_WITHDRAWAL) {
    return {
      allowed: false,
      reason: `Debes esperar ${MINIMUM_MONTHS_FOR_WITHDRAWAL} meses desde el inicio de rendimientos`
    }
  }

  const nextWindow = getNextWithdrawalWindow()
  if (!nextWindow) {
    return { allowed: false, reason: 'No hay ventanas de retiro disponibles' }
  }

  const deadline = new Date(nextWindow)
  deadline.setDate(deadline.getDate() - WITHDRAWAL_ADVANCE_DAYS)

  if (now > deadline) {
    return {
      allowed: false,
      reason: `La fecha límite para la próxima ventana ha pasado`
    }
  }

  return { allowed: true }
}

export async function getWithdrawalStatus() {
  const user = await getCurrentUser()
  if (!user) return null

  const eligibility = canRequestWithdrawal(user.yield_start_date)
  const nextWindow = getNextWithdrawalWindow()

  return {
    ...eligibility,
    nextWindow,
    currentBalance: user.current_balance,
    advanceDays: WITHDRAWAL_ADVANCE_DAYS,
  }
}

export async function createWithdrawalRequest(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as 'parcial' | 'total'

  // Validate eligibility
  const eligibility = canRequestWithdrawal(user.yield_start_date)
  if (!eligibility.allowed) {
    return { error: eligibility.reason }
  }

  // Validate amount
  if (type === 'parcial' && amount > user.current_balance) {
    return { error: 'El importe supera tu balance disponible' }
  }

  const finalAmount = type === 'total' ? user.current_balance : amount
  const nextWindow = getNextWithdrawalWindow()

  if (!nextWindow) {
    return { error: 'No hay ventanas de retiro disponibles' }
  }

  // Check for existing pending withdrawal
  const { data: existingWithdrawal } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['solicitado', 'aprobado'])
    .single()

  if (existingWithdrawal) {
    return { error: 'Ya tienes una solicitud de retiro pendiente' }
  }

  // Create withdrawal
  const { error } = await supabase.from('withdrawals').insert({
    user_id: user.id,
    amount: finalAmount,
    type,
    status: 'solicitado',
    withdrawal_window: nextWindow.toISOString().split('T')[0],
  })

  if (error) {
    return { error: 'Error al crear solicitud: ' + error.message }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'CREATE_WITHDRAWAL_REQUEST',
    entity_type: 'withdrawal',
    new_values: { amount: finalAmount, type, window: nextWindow },
  })

  revalidatePath('/dashboard/retiros')
  return { success: true }
}

export async function getMyWithdrawals() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', user.id)
    .order('requested_at', { ascending: false })

  if (error) return []
  return data
}

export async function getAllWithdrawals(status?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('withdrawals')
    .select('*, user:user_id(id, full_name, email, current_balance)')
    .order('requested_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return []
  return data
}

export async function approveWithdrawal(withdrawalId: string) {
  const supabase = await createClient()
  const admin = await getCurrentUser()

  if (!admin?.is_admin) {
    return { error: 'No autorizado' }
  }

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
    return { error: 'Error al aprobar' }
  }

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
  const admin = await getCurrentUser()

  if (!admin?.is_admin) {
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
    return { error: 'Retiro no encontrado o no aprobado' }
  }

  const user = withdrawal.user as any
  const balanceBefore = user.current_balance
  const balanceAfter = balanceBefore - withdrawal.amount

  if (balanceAfter < 0) {
    return { error: 'Balance insuficiente' }
  }

  // Update withdrawal status
  await supabase
    .from('withdrawals')
    .update({
      status: 'ejecutado',
      executed_at: new Date().toISOString(),
      executed_by: admin.id,
    })
    .eq('id', withdrawalId)

  // Update user balance
  await supabase
    .from('users')
    .update({
      current_balance: balanceAfter,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  // Record capital movement
  await supabase.from('capital_movements').insert({
    user_id: user.id,
    type: 'retiro',
    amount: -withdrawal.amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description: `Retiro ${withdrawal.type}`,
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
  const admin = await getCurrentUser()

  if (!admin?.is_admin) {
    return { error: 'No autorizado' }
  }

  const { error } = await supabase
    .from('withdrawals')
    .update({
      status: 'rechazado',
      rejected_at: new Date().toISOString(),
      rejected_by: admin.id,
      rejection_reason: reason,
    })
    .eq('id', withdrawalId)
    .eq('status', 'solicitado')

  if (error) {
    return { error: 'Error al rechazar' }
  }

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
```

### 8.2 Create Client Withdrawal Page

**app/(dashboard)/retiros/page.tsx**
- Withdrawal status card (next window, eligibility)
- Request withdrawal form (amount, type)
- Withdrawal history table

### 8.3 Create Backoffice Withdrawals Page

**app/(backoffice)/retiros/page.tsx**
- Filter by status tabs
- Withdrawals table with actions
- Approve/Execute/Reject buttons

### 8.4 Create UI Components

**components/dashboard/withdrawal-status.tsx**
**components/dashboard/withdrawal-form.tsx**
**components/dashboard/withdrawal-history.tsx**
**components/backoffice/withdrawals-table.tsx**
**components/backoffice/reject-withdrawal-dialog.tsx**

---

## Business Rules

1. **Windows**: March 31, June 30, Sept 30, Dec 31
2. **Advance**: Minimum 10 days before window
3. **Seniority**: Minimum 3 months from yield start
4. **One pending**: Only one active request at a time
5. **States**: solicitado → aprobado → ejecutado (or rechazado)
6. **Balance deducted**: Only when executed

---

## Files to Create

- [x] `lib/actions/retiros.ts`
- [x] `app/(dashboard)/retiros/page.tsx`
- [x] `app/(backoffice)/retiros/page.tsx`
- [x] `components/dashboard/withdrawal-status.tsx`
- [x] `components/dashboard/withdrawal-form.tsx`
- [x] `components/dashboard/withdrawal-history.tsx`
- [x] `components/backoffice/withdrawals-table.tsx`
- [x] `components/backoffice/reject-withdrawal-dialog.tsx`

---

## Acceptance Criteria

- [x] Client sees next withdrawal window
- [x] Client can request withdrawal in valid window
- [x] Seniority validation works
- [x] Only one pending request allowed
- [x] Admin can approve withdrawals
- [x] Admin can execute withdrawals
- [x] Admin can reject with reason
- [x] Balance updates on execution
- [x] Withdrawal history visible to client

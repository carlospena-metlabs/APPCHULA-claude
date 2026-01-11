# Session 06: Capital Management

## Agent: `fullstack-agent`

## Objective
Implement capital management system for initial deposits, increments, and balance adjustments from backoffice.

## Dependencies
- Session 04 completed
- Session 05 completed

---

## Tasks

### 6.1 Create Capital Actions

**lib/actions/capital.ts**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'

export async function addCapital(userId: string, amount: number, type: 'deposito_inicial' | 'incremento') {
  const supabase = await createClient()
  const admin = await getCurrentUser()

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
  const updateData: any = {
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
  await supabase.from('capital_movements').insert({
    user_id: userId,
    type,
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    executed_by: admin?.id,
  })

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: admin?.id,
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

  await supabase.from('capital_movements').insert({
    user_id: userId,
    type: 'ajuste',
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description: reason,
    executed_by: admin?.id,
  })

  await supabase.from('audit_logs').insert({
    user_id: admin?.id,
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
    user_id: admin?.id,
    action: 'SET_YIELD_START_DATE',
    entity_type: 'user',
    entity_id: userId,
    new_values: { yield_start_date: date },
  })

  revalidatePath(`/backoffice/usuarios/${userId}`)
  return { success: true }
}
```

### 6.2 Create Capital Management UI Components

**components/backoffice/add-capital-dialog.tsx**
- Dialog form to add capital (initial or increment)
- Amount input with validation
- Type selector

**components/backoffice/adjust-balance-dialog.tsx**
- Dialog form for balance adjustments
- Positive/negative amount
- Required reason field

**components/backoffice/capital-movements-table.tsx**
- Table showing all capital movements
- Type badges (deposito_inicial, incremento, retiro, comision, ajuste)
- Balance before/after columns

**components/backoffice/set-yield-date-dialog.tsx**
- Date picker for yield start date
- Shows eligibility rules (before/after 14th)

### 6.3 Update User Detail Page

Add capital management section to user detail:
- Current balance card
- Add Capital button (opens dialog)
- Adjust Balance button (admin only)
- Set Yield Date button
- Capital movements history table

---

## Business Rules to Implement

1. **Capital < 50,000 USD**: Does not generate yields
2. **Yield start date**:
   - If capital deposited ≤ 14th: starts 15th same month (50% first month)
   - If capital deposited > 14th: starts 1st next month
3. **All movements must be logged** in capital_movements and audit_logs
4. **Balance can never be negative**

---

## Files to Create

- [x] `lib/actions/capital.ts`
- [x] `components/backoffice/add-capital-dialog.tsx`
- [x] `components/backoffice/adjust-balance-dialog.tsx`
- [x] `components/backoffice/capital-movements-table.tsx`
- [x] `components/backoffice/set-yield-date-dialog.tsx`

---

## Acceptance Criteria

- [ ] Admin can add initial capital
- [ ] Admin can add capital increments
- [ ] Admin can adjust balance with reason
- [ ] All movements are recorded
- [ ] Yield start date can be set
- [ ] Capital movements history is visible
- [ ] Balance cannot go negative
- [ ] Audit logs are created

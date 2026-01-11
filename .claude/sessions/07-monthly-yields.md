# Session 07: Monthly Yields System

## Agent: `fullstack-agent`

## Objective
Implement the monthly closing process for applying yields to client balances with validation and approval workflow.

## Dependencies
- Session 06 completed

---

## Tasks

### 7.1 Create Monthly Yields Actions

**lib/actions/rendimientos.ts** (complete version)
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth'
import { MINIMUM_CAPITAL, GUARANTEED_PERCENTAGES } from '@/lib/utils'

interface YieldPreview {
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
      preview.reason = `Balance menor a ${MINIMUM_CAPITAL} USD`
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
      preview.reason = 'Aún no ha comenzado a generar rendimientos'
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
) {
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

export async function getClosureHistory() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('monthly_closures')
    .select('*, executed_by_user:executed_by(full_name)')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) return []
  return data
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
```

### 7.2 Create Monthly Close Page

**app/(backoffice)/cierre-mensual/page.tsx**
- Month/Year selector
- Base percentage input
- "Calculate Preview" button
- Validation table with checkboxes
- "Execute Close" button
- Closure history table

### 7.3 Create UI Components

**components/backoffice/monthly-close-form.tsx**
- Form with month, year, percentage inputs
- Calculate button

**components/backoffice/yields-preview-table.tsx**
- Table showing all calculated yields
- Eligible/Non-eligible badges
- Checkboxes for approval (pre-selected for eligible)
- Shows reason for non-eligible

**components/backoffice/closure-history-table.tsx**
- Table of past closures
- Month, year, percentage, users affected, total yield

---

## Business Rules to Implement

1. **Percentage selection**: If base < guaranteed, apply guaranteed
2. **Proportional first month**: 50% if started on 15th
3. **Minimum capital**: Skip users < 50,000 USD
4. **Yield start date required**: Skip users without date
5. **Cannot re-close month**: Check for existing executed closure
6. **Irreversible**: Once executed, cannot be undone

---

## Files to Create

- [x] `lib/actions/rendimientos.ts` (complete)
- [x] `app/(backoffice)/cierre-mensual/page.tsx`
- [x] `components/backoffice/monthly-close-form.tsx`
- [x] `components/backoffice/yields-preview-table.tsx`
- [x] `components/backoffice/closure-history-table.tsx`

---

## Acceptance Criteria

- [ ] Admin can select month/year/percentage
- [ ] Preview calculates correctly for all users
- [ ] Guaranteed percentage is respected
- [ ] Proportional first month works
- [ ] Users below minimum are excluded
- [ ] Admin can exclude users from closure
- [ ] Execute updates all balances
- [ ] Yield records are created
- [ ] Cannot close same month twice
- [ ] Closure history is visible

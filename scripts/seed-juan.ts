import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestData() {
  console.log('Buscando usuario juan@gmail.com...')

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'juan@gmail.com')
    .single()

  if (userError || !user) {
    console.error('No se encontro usuario:', userError?.message)
    return
  }

  console.log(`Usuario encontrado: ${user.full_name} (${user.email})`)
  console.log(`Tipo: ${user.user_type}, Estado: ${user.status}`)

  // Update user with initial capital
  const initialCapital = 100000
  await supabase
    .from('users')
    .update({
      initial_capital: initialCapital,
      current_balance: initialCapital,
      yield_start_date: '2025-10-01',
      guaranteed_percentage: 3.25,
    })
    .eq('id', user.id)

  console.log(`Capital inicial establecido: $${initialCapital}`)

  // Delete existing data for clean slate
  await supabase.from('capital_movements').delete().eq('user_id', user.id)
  await supabase.from('monthly_yields').delete().eq('user_id', user.id)
  await supabase.from('withdrawals').delete().eq('user_id', user.id)
  console.log('Datos anteriores limpiados')

  // Create capital movement for initial deposit
  await supabase.from('capital_movements').insert({
    user_id: user.id,
    type: 'deposito_inicial',
    amount: initialCapital,
    balance_before: 0,
    balance_after: initialCapital,
    description: 'Deposito inicial de capital',
  })
  console.log('Movimiento de deposito inicial creado')

  // Create monthly yields for the last 3 months
  const yields = [
    { year: 2025, month: 10, percentage: 3.25, is_proportional: true },
    { year: 2025, month: 11, percentage: 3.25, is_proportional: false },
    { year: 2025, month: 12, percentage: 3.25, is_proportional: false },
  ]

  let currentBalance = initialCapital

  for (const yld of yields) {
    const yieldAmount = yld.is_proportional
      ? currentBalance * (yld.percentage / 100) * 0.5
      : currentBalance * (yld.percentage / 100)

    const balanceBefore = currentBalance
    const balanceAfter = currentBalance + yieldAmount
    currentBalance = balanceAfter

    await supabase.from('monthly_yields').insert({
      user_id: user.id,
      year: yld.year,
      month: yld.month,
      percentage_applied: yld.percentage,
      yield_amount: Math.round(yieldAmount * 100) / 100,
      balance_before: Math.round(balanceBefore * 100) / 100,
      balance_after: Math.round(balanceAfter * 100) / 100,
      is_proportional: yld.is_proportional,
    })

    console.log(`Rendimiento ${yld.month}/${yld.year}: +$${yieldAmount.toFixed(2)}`)
  }

  // Update user's current balance
  await supabase
    .from('users')
    .update({ current_balance: Math.round(currentBalance * 100) / 100 })
    .eq('id', user.id)

  console.log(`Balance final: $${currentBalance.toFixed(2)}`)

  // Create sample withdrawals
  await supabase.from('withdrawals').insert([
    {
      user_id: user.id,
      amount: 5000,
      type: 'parcial',
      status: 'ejecutado',
      withdrawal_window: '2025-12-31',
      requested_at: '2025-12-20T10:00:00Z',
      approved_at: '2025-12-22T14:00:00Z',
      executed_at: '2025-12-31T09:00:00Z',
    },
    {
      user_id: user.id,
      amount: 2000,
      type: 'parcial',
      status: 'solicitado',
      withdrawal_window: '2026-03-31',
      requested_at: '2026-01-10T10:00:00Z',
    },
  ])
  console.log('Retiros de ejemplo creados')

  console.log('\n✓ Datos de prueba para juan@gmail.com insertados!')
}

seedTestData().catch(console.error)

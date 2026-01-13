import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestData() {
  console.log('Buscando usuario cliente...')

  // Find a client user
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('user_type', 'cliente')
    .limit(1)

  if (userError || !users || users.length === 0) {
    console.error('No se encontro usuario cliente:', userError?.message)
    return
  }

  const user = users[0]
  console.log(`Usuario encontrado: ${user.full_name} (${user.email})`)

  // Update user with initial capital if not set
  if (user.initial_capital === 0) {
    const initialCapital = 100000
    await supabase
      .from('users')
      .update({
        initial_capital: initialCapital,
        current_balance: initialCapital,
        yield_start_date: '2025-10-01',
        status: 'activo',
      })
      .eq('id', user.id)

    user.initial_capital = initialCapital
    user.current_balance = initialCapital
    console.log(`Capital inicial establecido: $${initialCapital}`)
  }

  // Create capital movement for initial deposit
  const { data: existingMovement } = await supabase
    .from('capital_movements')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'deposito_inicial')
    .single()

  if (!existingMovement) {
    await supabase.from('capital_movements').insert({
      user_id: user.id,
      type: 'deposito_inicial',
      amount: user.initial_capital,
      balance_before: 0,
      balance_after: user.initial_capital,
      description: 'Deposito inicial de capital',
    })
    console.log('Movimiento de deposito inicial creado')
  }

  // Create monthly yields for the last 3 months
  const yields = [
    { year: 2025, month: 10, percentage: 3.25, is_proportional: true },
    { year: 2025, month: 11, percentage: 3.25, is_proportional: false },
    { year: 2025, month: 12, percentage: 3.25, is_proportional: false },
  ]

  let currentBalance = user.initial_capital

  for (const yld of yields) {
    // Check if yield already exists
    const { data: existingYield } = await supabase
      .from('monthly_yields')
      .select('id')
      .eq('user_id', user.id)
      .eq('year', yld.year)
      .eq('month', yld.month)
      .single()

    if (existingYield) {
      console.log(`Rendimiento ${yld.month}/${yld.year} ya existe, saltando...`)
      continue
    }

    const yieldAmount = yld.is_proportional
      ? currentBalance * (yld.percentage / 100) * 0.5  // 50% for proportional
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

  console.log(`Balance actualizado: $${currentBalance.toFixed(2)}`)

  // Create a sample withdrawal request
  const { data: existingWithdrawal } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existingWithdrawal) {
    await supabase.from('withdrawals').insert({
      user_id: user.id,
      amount: 5000,
      type: 'parcial',
      status: 'ejecutado',
      withdrawal_window: '2025-12-31',
      requested_at: '2025-12-20T10:00:00Z',
      approved_at: '2025-12-22T14:00:00Z',
      executed_at: '2025-12-31T09:00:00Z',
    })
    console.log('Retiro de ejemplo creado: $5,000 (ejecutado)')
  }

  console.log('\n✓ Datos de prueba insertados correctamente!')
  console.log('Ahora puedes ver el dashboard con datos reales.')
}

seedTestData().catch(console.error)

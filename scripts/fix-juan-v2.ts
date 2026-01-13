import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fix() {
  const { data: user } = await supabase
    .from('users')
    .select('id, initial_capital')
    .eq('email', 'juan@gmail.com')
    .single()

  if (!user) {
    console.log('Usuario no encontrado')
    return
  }

  console.log('User ID:', user.id)
  console.log('Capital inicial actual:', user.initial_capital)

  const initialCapital = user.initial_capital // Usar el valor existente

  // Update balance and percentage (campos que si se pueden modificar)
  const { error: updateError } = await supabase
    .from('users')
    .update({
      current_balance: 54062.50,  // Calculado con 3.25% sobre 50k
      guaranteed_percentage: 3.25,
      yield_start_date: '2025-10-01',
    })
    .eq('id', user.id)

  if (updateError) {
    console.log('Error actualizando:', updateError.message)
    return
  }
  console.log('Usuario actualizado (balance, %, fecha)')

  // Delete old yields
  await supabase.from('monthly_yields').delete().eq('user_id', user.id)

  // Insert yields based on actual initial_capital ($50,000)
  const yields = [
    {
      user_id: user.id,
      year: 2025,
      month: 10,
      percentage_applied: 3.25,
      yield_amount: 812.50,  // 50000 * 3.25% * 0.5 (proporcional)
      balance_before: 50000,
      balance_after: 50812.50,
      is_proportional: true,
    },
    {
      user_id: user.id,
      year: 2025,
      month: 11,
      percentage_applied: 3.25,
      yield_amount: 1651.41,  // 50812.50 * 3.25%
      balance_before: 50812.50,
      balance_after: 52463.91,
      is_proportional: false,
    },
    {
      user_id: user.id,
      year: 2025,
      month: 12,
      percentage_applied: 3.25,
      yield_amount: 1705.08,  // 52463.91 * 3.25%
      balance_before: 52463.91,
      balance_after: 54168.99,
      is_proportional: false,
    },
  ]

  await supabase.from('monthly_yields').insert(yields)
  console.log('3 rendimientos insertados')

  // Update final balance
  await supabase
    .from('users')
    .update({ current_balance: 54168.99 })
    .eq('id', user.id)

  // Verify
  const { data: updated } = await supabase
    .from('users')
    .select('initial_capital, current_balance, guaranteed_percentage, yield_start_date')
    .eq('id', user.id)
    .single()

  const { data: yieldCount } = await supabase
    .from('monthly_yields')
    .select('id')
    .eq('user_id', user.id)

  console.log('\n=== Verificacion ===')
  console.log('Capital Inicial:', updated?.initial_capital)
  console.log('Balance Actual:', updated?.current_balance)
  console.log('% Garantizado:', updated?.guaranteed_percentage)
  console.log('Inicio Rendimientos:', updated?.yield_start_date)
  console.log('Rendimientos:', yieldCount?.length)
  console.log('\n✓ Listo!')
}

fix()

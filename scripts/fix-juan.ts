import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fix() {
  // Get user
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'juan@gmail.com')
    .single()

  if (error || !user) {
    console.log('Error:', error?.message)
    return
  }

  console.log('User ID:', user.id)

  // Fix user data
  const { error: updateError } = await supabase
    .from('users')
    .update({
      initial_capital: 100000,
      current_balance: 108337.97,
      guaranteed_percentage: 3.25,
      yield_start_date: '2025-10-01',
    })
    .eq('id', user.id)

  if (updateError) {
    console.log('Error actualizando usuario:', updateError.message)
    return
  }
  console.log('Usuario actualizado')

  // Delete old yields
  await supabase.from('monthly_yields').delete().eq('user_id', user.id)
  console.log('Rendimientos anteriores eliminados')

  // Insert correct yields
  const yields = [
    {
      user_id: user.id,
      year: 2025,
      month: 10,
      percentage_applied: 3.25,
      yield_amount: 1625.00,
      balance_before: 100000,
      balance_after: 101625.00,
      is_proportional: true,
    },
    {
      user_id: user.id,
      year: 2025,
      month: 11,
      percentage_applied: 3.25,
      yield_amount: 3302.81,
      balance_before: 101625.00,
      balance_after: 104927.81,
      is_proportional: false,
    },
    {
      user_id: user.id,
      year: 2025,
      month: 12,
      percentage_applied: 3.25,
      yield_amount: 3410.16,
      balance_before: 104927.81,
      balance_after: 108337.97,
      is_proportional: false,
    },
  ]

  const { error: yieldError } = await supabase.from('monthly_yields').insert(yields)
  if (yieldError) {
    console.log('Error insertando rendimientos:', yieldError.message)
    return
  }
  console.log('3 rendimientos insertados')

  // Verify
  const { data: updated } = await supabase
    .from('users')
    .select('initial_capital, current_balance, guaranteed_percentage')
    .eq('id', user.id)
    .single()

  console.log('\n=== Verificacion ===')
  console.log('Capital Inicial:', updated?.initial_capital)
  console.log('Balance Actual:', updated?.current_balance)
  console.log('% Garantizado:', updated?.guaranteed_percentage)
  console.log('\n✓ Datos corregidos!')
}

fix()

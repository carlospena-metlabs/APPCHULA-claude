import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, full_name, initial_capital, current_balance, guaranteed_percentage, yield_start_date, status')
    .eq('email', 'juan@gmail.com')
    .single()

  if (error) {
    console.log('Error:', error.message)
    return
  }

  console.log('=== Usuario en Supabase ===')
  console.log('Email:', user.email)
  console.log('Nombre:', user.full_name)
  console.log('Capital Inicial:', user.initial_capital)
  console.log('Balance Actual:', user.current_balance)
  console.log('% Garantizado:', user.guaranteed_percentage)
  console.log('Inicio Rendimientos:', user.yield_start_date)
  console.log('Estado:', user.status)

  const { data: yields } = await supabase
    .from('monthly_yields')
    .select('year, month, yield_amount, balance_after')
    .eq('user_id', user.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  console.log('\n=== Rendimientos ===')
  console.log('Total registros:', yields?.length || 0)
  yields?.forEach(y => {
    console.log(`  ${y.month}/${y.year}: +$${y.yield_amount} -> $${y.balance_after}`)
  })
}

check()

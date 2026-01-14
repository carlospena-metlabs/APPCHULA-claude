import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && !key.startsWith('#')) {
    process.env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function listUsers() {
  const { data: users, error } = await supabase
    .from('users')
    .select('email, full_name, user_type, is_admin, is_operator, status')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('\n=== USUARIOS DEL SISTEMA ===\n')

  if (!users || users.length === 0) {
    console.log('No hay usuarios registrados.')
    return
  }

  // Print table header
  console.log('| Email | Nombre | Tipo | Admin | Operador | Estado |')
  console.log('|-------|--------|------|-------|----------|--------|')

  for (const user of users) {
    console.log(`| ${user.email} | ${user.full_name || '-'} | ${user.user_type} | ${user.is_admin ? '✓' : '✗'} | ${user.is_operator ? '✓' : '✗'} | ${user.status} |`)
  }

  console.log(`\nTotal: ${users.length} usuarios`)
}

listUsers()

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && !key.startsWith('#')) {
    process.env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  const email = 'admin@appchula.com'
  const password = 'password123'

  console.log('Creando usuario administrador...')

  // 1. Crear usuario en auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('El usuario ya existe en auth, buscando ID...')
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingUser = users?.find(u => u.email === email)
      if (existingUser) {
        console.log('Usuario auth encontrado:', existingUser.id)
        await createPublicUser(existingUser.id, email)
      }
      return
    }
    console.error('Error creando auth user:', authError.message)
    return
  }

  console.log('Usuario auth creado:', authData.user.id)
  await createPublicUser(authData.user.id, email)
}

async function createPublicUser(userId: string, email: string) {
  // Check if public user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (existingUser) {
    // Update existing user to be admin
    const { error: updateError } = await supabase
      .from('users')
      .update({
        user_type: 'super_agente',
        is_admin: true,
        status: 'activo',
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error actualizando user:', updateError.message)
      return
    }
    console.log('Usuario actualizado a admin!')
  } else {
    // Create new public user
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email,
      full_name: 'Admin Super Agente',
      user_type: 'super_agente',
      is_admin: true,
      is_operator: false,
      status: 'activo',
      guaranteed_percentage: 2.5,
      initial_capital: 0,
      current_balance: 0,
    })

    if (userError) {
      console.error('Error creando public user:', userError.message)
      return
    }
    console.log('Usuario public creado!')
  }

  console.log('\n✓ Usuario administrador creado exitosamente!')
  console.log('----------------------------------------')
  console.log('Email: admin@appchula.com')
  console.log('Password: password123')
  console.log('Tipo: super_agente')
  console.log('Admin: true')
  console.log('----------------------------------------')
}

createAdminUser().catch(console.error)

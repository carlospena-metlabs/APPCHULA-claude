# Session 04: Backoffice Users Management

## Agent: `fullstack-agent`

## Objective
Implement the Backoffice user management system including CRUD operations, role assignment, and invitation sending.

## Dependencies
- Session 03 completed
- Auth system working

---

## Tasks

### 4.1 Create Backoffice Layout

**app/(backoffice)/layout.tsx**
```typescript
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { BackofficeSidebar } from '@/components/backoffice/sidebar'
import { BackofficeHeader } from '@/components/backoffice/header'

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!user.is_admin && !user.is_operator) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BackofficeSidebar user={user} />
      <div className="lg:pl-64">
        <BackofficeHeader user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
```

### 4.2 Create Sidebar Component

**components/backoffice/sidebar.tsx**
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User } from '@/types'
import {
  Users,
  Calculator,
  ArrowDownToLine,
  FileText,
  Home,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/backoffice', icon: Home },
  { name: 'Usuarios', href: '/backoffice/usuarios', icon: Users },
  { name: 'Cierre Mensual', href: '/backoffice/cierre-mensual', icon: Calculator },
  { name: 'Retiros', href: '/backoffice/retiros', icon: ArrowDownToLine },
  { name: 'Logs', href: '/backoffice/logs', icon: FileText },
]

export function BackofficeSidebar({ user }: { user: User }) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-slate-900 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <span className="text-xl font-bold text-white">APPCHULA</span>
          <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
            Backoffice
          </span>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/backoffice' && pathname.startsWith(item.href))

            // Operators can't access Cierre Mensual
            if (item.href === '/backoffice/cierre-mensual' && !user.is_admin) {
              return null
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            {user.full_name}
          </p>
          <p className="text-xs text-slate-500">
            {user.is_admin ? 'Administrador' : 'Operador'}
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 4.3 Create Header Component

**components/backoffice/header.tsx**
```typescript
'use client'

import { User } from '@/types'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User as UserIcon } from 'lucide-react'

export function BackofficeHeader({ user }: { user: User }) {
  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <UserIcon className="mr-2 h-4 w-4" />
              {user.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

### 4.4 Create User Actions

**lib/actions/users.ts**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { User, UserType, UserStatus } from '@/types'
import { GUARANTEED_PERCENTAGES } from '@/lib/utils'
import { randomBytes } from 'crypto'

const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  user_type: z.enum(['cliente', 'agente', 'super_agente']),
  guaranteed_percentage: z.number().refine(
    (val) => GUARANTEED_PERCENTAGES.includes(val as any),
    { message: 'Porcentaje no válido' }
  ),
  agent_id: z.string().uuid().optional().nullable(),
  super_agent_id: z.string().uuid().optional().nullable(),
  initial_capital: z.number().min(0).default(0),
})

const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().uuid(),
})

export async function getUsers(filters?: {
  type?: UserType
  status?: UserStatus
  search?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('users')
    .select(`
      *,
      agent:agent_id(id, full_name, email),
      super_agent:super_agent_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (filters?.type) {
    query = query.eq('user_type', filters.type)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data
}

export async function getUser(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      agent:agent_id(id, full_name, email),
      super_agent:super_agent_id(id, full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createUser(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string || undefined,
    user_type: formData.get('user_type') as UserType,
    guaranteed_percentage: parseFloat(formData.get('guaranteed_percentage') as string),
    agent_id: formData.get('agent_id') as string || null,
    super_agent_id: formData.get('super_agent_id') as string || null,
    initial_capital: parseFloat(formData.get('initial_capital') as string) || 0,
  }

  const validated = createUserSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  // Create user in Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  })

  if (authError) {
    return { error: 'Error al crear usuario: ' + authError.message }
  }

  // Create user in public.users
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      user_type: data.user_type,
      guaranteed_percentage: data.guaranteed_percentage,
      agent_id: data.agent_id,
      super_agent_id: data.super_agent_id,
      initial_capital: data.initial_capital,
      current_balance: data.initial_capital,
    })

  if (insertError) {
    // Cleanup auth user
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return { error: 'Error al crear perfil: ' + insertError.message }
  }

  revalidatePath('/backoffice/usuarios')
  return { success: true, userId: authUser.user.id }
}

export async function updateUser(formData: FormData) {
  const supabase = await createClient()

  const data = {
    id: formData.get('id') as string,
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string || undefined,
    user_type: formData.get('user_type') as UserType,
    guaranteed_percentage: parseFloat(formData.get('guaranteed_percentage') as string),
    agent_id: formData.get('agent_id') as string || null,
    super_agent_id: formData.get('super_agent_id') as string || null,
  }

  const validated = updateUserSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      user_type: data.user_type,
      guaranteed_percentage: data.guaranteed_percentage,
      agent_id: data.agent_id,
      super_agent_id: data.super_agent_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (error) {
    return { error: 'Error al actualizar: ' + error.message }
  }

  revalidatePath('/backoffice/usuarios')
  revalidatePath(`/backoffice/usuarios/${data.id}`)
  return { success: true }
}

export async function blockUser(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({ status: 'bloqueado', updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    return { error: 'Error al bloquear usuario' }
  }

  revalidatePath('/backoffice/usuarios')
  return { success: true }
}

export async function unblockUser(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({ status: 'activo', updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    return { error: 'Error al desbloquear usuario' }
  }

  revalidatePath('/backoffice/usuarios')
  return { success: true }
}

export async function sendInvitation(userId: string) {
  const supabase = await createClient()

  // Generate token
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  // Invalidate previous invitations
  await supabase
    .from('invitations')
    .delete()
    .eq('user_id', userId)
    .is('used_at', null)

  // Create new invitation
  const { error } = await supabase
    .from('invitations')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    return { error: 'Error al crear invitación' }
  }

  // TODO: Send email with Resend
  // For now, return the activation URL
  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${token}`

  return { success: true, activationUrl }
}

export async function getAgents() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('user_type', 'agente')
    .eq('status', 'activo')

  if (error) return []
  return data
}

export async function getSuperAgents() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('user_type', 'super_agente')
    .eq('status', 'activo')

  if (error) return []
  return data
}
```

### 4.5 Create Users List Page

**app/(backoffice)/usuarios/page.tsx**
```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import { getUsers } from '@/lib/actions/users'
import { Button } from '@/components/ui/button'
import { UsersTable } from '@/components/backoffice/users-table'
import { UsersFilters } from '@/components/backoffice/users-filters'
import { Plus } from 'lucide-react'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { type?: string; status?: string; search?: string }
}) {
  const users = await getUsers({
    type: searchParams.type as any,
    status: searchParams.status as any,
    search: searchParams.search,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <Link href="/backoffice/usuarios/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      <UsersFilters />

      <Suspense fallback={<div>Cargando...</div>}>
        <UsersTable users={users} />
      </Suspense>
    </div>
  )
}
```

### 4.6 Create Users Table Component

**components/backoffice/users-table.tsx**
```typescript
'use client'

import Link from 'next/link'
import { User } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

const statusColors = {
  activo: 'bg-green-100 text-green-800',
  no_verificado: 'bg-yellow-100 text-yellow-800',
  bloqueado: 'bg-red-100 text-red-800',
}

const typeLabels = {
  cliente: 'Cliente',
  agente: 'Agente',
  super_agente: 'Super Agente',
}

export function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{typeLabels[user.user_type]}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[user.status]}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(user.current_balance)}
              </TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell>
                <Link href={`/backoffice/usuarios/${user.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 4.7 Create User Detail Page

**app/(backoffice)/usuarios/[id]/page.tsx**
```typescript
import { notFound } from 'next/navigation'
import { getUser, getAgents, getSuperAgents } from '@/lib/actions/users'
import { getCurrentUser } from '@/lib/actions/auth'
import { UserDetail } from '@/components/backoffice/user-detail'

export default async function UserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [user, currentUser, agents, superAgents] = await Promise.all([
    getUser(params.id),
    getCurrentUser(),
    getAgents(),
    getSuperAgents(),
  ])

  if (!user) {
    notFound()
  }

  return (
    <UserDetail
      user={user}
      currentUser={currentUser!}
      agents={agents}
      superAgents={superAgents}
    />
  )
}
```

### 4.8 Create New User Page

**app/(backoffice)/usuarios/nuevo/page.tsx**
```typescript
import { getAgents, getSuperAgents } from '@/lib/actions/users'
import { CreateUserForm } from '@/components/backoffice/create-user-form'

export default async function NewUserPage() {
  const [agents, superAgents] = await Promise.all([
    getAgents(),
    getSuperAgents(),
  ])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Nuevo Usuario</h1>
      <CreateUserForm agents={agents} superAgents={superAgents} />
    </div>
  )
}
```

---

## Files to Create

- [x] `app/(backoffice)/layout.tsx`
- [x] `app/(backoffice)/page.tsx`
- [x] `app/(backoffice)/usuarios/page.tsx`
- [x] `app/(backoffice)/usuarios/[id]/page.tsx`
- [x] `app/(backoffice)/usuarios/nuevo/page.tsx`
- [x] `lib/actions/users.ts`
- [x] `components/backoffice/sidebar.tsx`
- [x] `components/backoffice/header.tsx`
- [x] `components/backoffice/users-table.tsx`
- [x] `components/backoffice/users-filters.tsx`
- [x] `components/backoffice/user-detail.tsx`
- [x] `components/backoffice/create-user-form.tsx`

---

## Acceptance Criteria

- [ ] Backoffice layout shows sidebar and header
- [ ] Only admins/operators can access backoffice
- [ ] Users list displays all users with filters
- [ ] Admin can create new users
- [ ] Admin can edit user details
- [ ] Admin can block/unblock users
- [ ] Admin can send invitations
- [ ] Operators can view but not modify

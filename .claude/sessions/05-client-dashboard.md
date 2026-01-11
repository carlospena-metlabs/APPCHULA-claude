# Session 05: Client Dashboard

## Agent: `frontend-agent`

## Objective
Implement the client-facing dashboard with financial summary, balance evolution chart, and yields history.

## Dependencies
- Session 03 completed
- Session 04 completed

---

## Tasks

### 5.1 Create Dashboard Layout

**app/(dashboard)/layout.tsx**
```typescript
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar user={user} />
      <div className="lg:pl-64">
        <DashboardHeader user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
```

### 5.2 Create Dashboard Sidebar

**components/dashboard/sidebar.tsx**
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User } from '@/types'
import {
  LayoutDashboard,
  TrendingUp,
  ArrowDownToLine,
  UserCircle,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Rendimientos', href: '/dashboard/rendimientos', icon: TrendingUp },
  { name: 'Retiros', href: '/dashboard/retiros', icon: ArrowDownToLine },
  { name: 'Perfil', href: '/dashboard/perfil', icon: UserCircle },
]

export function DashboardSidebar({ user }: { user: User }) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-slate-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <span className="text-xl font-bold text-slate-900">APPCHULA</span>
        </div>
        <nav className="mt-8 flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Agent Info */}
        {user.agent_id && (
          <div className="px-4 py-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Tu agente
            </p>
            <p className="text-sm font-medium text-slate-900 mt-1">
              {(user as any).agent?.full_name}
            </p>
            <p className="text-xs text-slate-500">
              {(user as any).agent?.email}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 5.3 Create Dashboard Header

**components/dashboard/header.tsx**
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
import { LogOut, User as UserIcon, Settings } from 'lucide-react'
import Link from 'next/link'

export function DashboardHeader({ user }: { user: User }) {
  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bienvenido, {user.full_name.split(' ')[0]}
          </h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/perfil">
                <UserIcon className="mr-2 h-4 w-4" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            {(user.is_admin || user.is_operator) && (
              <DropdownMenuItem asChild>
                <Link href="/backoffice">
                  <Settings className="mr-2 h-4 w-4" />
                  Backoffice
                </Link>
              </DropdownMenuItem>
            )}
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

### 5.4 Create Dashboard Main Page

**app/(dashboard)/page.tsx**
```typescript
import { getCurrentUser } from '@/lib/actions/auth'
import { getYieldsHistory } from '@/lib/actions/rendimientos'
import { FinancialSummary } from '@/components/dashboard/financial-summary'
import { BalanceChart } from '@/components/dashboard/balance-chart'
import { RecentYields } from '@/components/dashboard/recent-yields'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const yields = await getYieldsHistory(user!.id)

  return (
    <div className="space-y-6">
      <FinancialSummary user={user!} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BalanceChart yields={yields} />
        <RecentYields yields={yields.slice(0, 6)} />
      </div>
    </div>
  )
}
```

### 5.5 Create Financial Summary Component

**components/dashboard/financial-summary.tsx**
```typescript
import { User } from '@/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Wallet, PiggyBank } from 'lucide-react'

export function FinancialSummary({ user }: { user: User }) {
  const totalYield = user.current_balance - user.initial_capital
  const yieldPercentage = user.initial_capital > 0
    ? ((totalYield / user.initial_capital) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            Capital Inicial
          </CardTitle>
          <PiggyBank className="h-5 w-5 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(user.initial_capital)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            Balance Actual
          </CardTitle>
          <Wallet className="h-5 w-5 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(user.current_balance)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            Rendimiento Total
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalYield)}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {formatPercentage(yieldPercentage)} sobre capital inicial
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 5.6 Create Balance Chart Component

**components/dashboard/balance-chart.tsx**
```typescript
'use client'

import { MonthlyYield } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const months = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

export function BalanceChart({ yields }: { yields: MonthlyYield[] }) {
  const data = yields
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
    .map(y => ({
      name: `${months[y.month - 1]} ${y.year}`,
      balance: y.balance_after,
    }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución del Balance</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-slate-500">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución del Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Balance']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 5.7 Create Recent Yields Component

**components/dashboard/recent-yields.tsx**
```typescript
import { MonthlyYield } from '@/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function RecentYields({ yields }: { yields: MonthlyYield[] }) {
  if (yields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rendimientos Recientes</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-slate-500">No hay rendimientos registrados</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimientos Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead className="text-right">Importe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yields.map((y) => (
              <TableRow key={y.id}>
                <TableCell>
                  {months[y.month - 1]} {y.year}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercentage(y.percentage_applied)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  +{formatCurrency(y.yield_amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### 5.8 Create Yields History Page

**app/(dashboard)/rendimientos/page.tsx**
```typescript
import { getCurrentUser } from '@/lib/actions/auth'
import { getYieldsHistory } from '@/lib/actions/rendimientos'
import { YieldsHistory } from '@/components/dashboard/yields-history'
import { ExportButton } from '@/components/dashboard/export-button'

export default async function YieldsPage() {
  const user = await getCurrentUser()
  const yields = await getYieldsHistory(user!.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Histórico de Rendimientos
        </h1>
        <ExportButton data={yields} type="yields" />
      </div>

      <YieldsHistory yields={yields} />
    </div>
  )
}
```

### 5.9 Create Profile Page

**app/(dashboard)/perfil/page.tsx**
```typescript
import { getCurrentUser } from '@/lib/actions/auth'
import { ProfileInfo } from '@/components/dashboard/profile-info'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
      <ProfileInfo user={user!} />
    </div>
  )
}
```

### 5.10 Create Yields Actions

**lib/actions/rendimientos.ts** (partial - for client dashboard)
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { MonthlyYield } from '@/types'

export async function getYieldsHistory(userId: string): Promise<MonthlyYield[]> {
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

---

## Files to Create

- [x] `app/(dashboard)/layout.tsx`
- [x] `app/(dashboard)/page.tsx`
- [x] `app/(dashboard)/rendimientos/page.tsx`
- [x] `app/(dashboard)/perfil/page.tsx`
- [x] `components/dashboard/sidebar.tsx`
- [x] `components/dashboard/header.tsx`
- [x] `components/dashboard/financial-summary.tsx`
- [x] `components/dashboard/balance-chart.tsx`
- [x] `components/dashboard/recent-yields.tsx`
- [x] `components/dashboard/yields-history.tsx`
- [x] `components/dashboard/profile-info.tsx`
- [x] `components/dashboard/export-button.tsx`
- [x] `lib/actions/rendimientos.ts`

---

## Acceptance Criteria

- [ ] Dashboard shows financial summary cards
- [ ] Balance evolution chart renders correctly
- [ ] Recent yields table shows last 6 months
- [ ] Yields history page shows full history
- [ ] Profile page displays user info
- [ ] Agent info shows in sidebar if assigned
- [ ] Responsive design works on mobile
- [ ] Export button generates CSV

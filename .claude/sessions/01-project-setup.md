# Session 01: Project Setup

## Agent: `setup-agent`

## Objective
Initialize the Next.js project with all required dependencies and base configuration.

## Dependencies
- None (first session)

---

## Tasks

### 1.1 Initialize Next.js Project
```bash
npx create-next-app@latest appchula --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

### 1.2 Install Core Dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install zod react-hook-form @hookform/resolvers
npm install date-fns
npm install recharts
npm install lucide-react
npm install clsx tailwind-merge class-variance-authority
```

### 1.3 Install shadcn/ui
```bash
npx shadcn@latest init
# Select: New York style, Slate color, CSS variables: yes

npx shadcn@latest add button card input label table tabs badge dialog alert-dialog dropdown-menu select checkbox form toast sonner separator avatar sheet skeleton
```

### 1.4 Install Dev Dependencies
```bash
npm install -D @types/node prettier prettier-plugin-tailwindcss
```

### 1.5 Create Folder Structure
```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── activate/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── rendimientos/
│   │   └── page.tsx
│   ├── retiros/
│   │   └── page.tsx
│   └── perfil/
│       └── page.tsx
├── (backoffice)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── usuarios/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── cierre-mensual/
│   │   └── page.tsx
│   ├── retiros/
│   │   └── page.tsx
│   └── logs/
│       └── page.tsx
├── api/
│   └── webhooks/
│       └── route.ts
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── ui/              # shadcn components (auto-generated)
├── dashboard/
├── backoffice/
└── shared/

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── actions/
├── utils/
│   └── index.ts
└── validations/

types/
└── index.ts

hooks/
└── index.ts
```

### 1.6 Configure Supabase Clients

**lib/supabase/client.ts**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**lib/supabase/server.ts**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**lib/supabase/middleware.ts**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
```

### 1.7 Create Base Types

**types/index.ts**
```typescript
export type UserType = 'cliente' | 'agente' | 'super_agente'
export type UserStatus = 'activo' | 'no_verificado' | 'bloqueado'
export type WithdrawalStatus = 'solicitado' | 'aprobado' | 'ejecutado' | 'rechazado'
export type WithdrawalType = 'parcial' | 'total'
export type CommissionStatus = 'pendiente' | 'acreditada'

export interface User {
  id: string
  email: string
  phone?: string
  full_name: string
  user_type: UserType
  status: UserStatus
  agent_id?: string
  super_agent_id?: string
  is_admin: boolean
  is_operator: boolean
  initial_capital: number
  current_balance: number
  guaranteed_percentage: number
  yield_start_date?: string
  created_at: string
  updated_at: string
  activated_at?: string
}

export interface MonthlyYield {
  id: string
  user_id: string
  year: number
  month: number
  percentage_applied: number
  yield_amount: number
  balance_before: number
  balance_after: number
  is_proportional: boolean
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  type: WithdrawalType
  status: WithdrawalStatus
  withdrawal_window: string
  requested_at: string
  approved_at?: string
  executed_at?: string
  notes?: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  created_at: string
}
```

### 1.8 Create Utility Functions

**lib/utils/index.ts**
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export const GUARANTEED_PERCENTAGES = [2.5, 3.25, 4.25, 5.0] as const
export const WITHDRAWAL_WINDOWS = ['03-31', '06-30', '09-30', '12-31'] as const
export const MINIMUM_CAPITAL = 50000
export const WITHDRAWAL_ADVANCE_DAYS = 10
export const MINIMUM_MONTHS_FOR_WITHDRAWAL = 3
```

### 1.9 Setup Environment Variables

Copy `.env.example` to `.env.local` and fill in Supabase credentials.

---

## Files to Create

- [x] `app/layout.tsx` (base layout)
- [x] `app/page.tsx` (redirect to login)
- [x] `lib/supabase/client.ts`
- [x] `lib/supabase/server.ts`
- [x] `lib/supabase/middleware.ts`
- [x] `lib/utils/index.ts`
- [x] `types/index.ts`
- [x] Folder structure for all routes

---

## Acceptance Criteria

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes successfully
- [ ] Supabase client can be imported
- [ ] All route folders exist
- [ ] shadcn/ui components are installed
- [ ] TypeScript compiles without errors

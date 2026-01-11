# Session 09: Audit Logs System

## Agent: `backend-agent`

## Objective
Implement comprehensive audit logging system with viewing interface and ensure all critical actions are properly logged.

## Dependencies
- Session 08 completed

---

## Tasks

### 9.1 Create Audit Log Actions

**lib/actions/audit.ts**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: {
    full_name: string
    email: string
  }
}

export async function getAuditLogs(filters?: {
  action?: string
  entityType?: string
  userId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('audit_logs')
    .select('*, user:user_id(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.action) {
    query = query.eq('action', filters.action)
  }

  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType)
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  const limit = filters?.limit || 50
  const offset = filters?.offset || 0

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) return { logs: [], total: 0 }
  return { logs: data as AuditLogEntry[], total: count || 0 }
}

export async function getAuditLogActions(): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('audit_logs')
    .select('action')
    .limit(100)

  if (!data) return []

  const actions = [...new Set(data.map(d => d.action))]
  return actions.sort()
}

export async function getAuditLogEntityTypes(): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('audit_logs')
    .select('entity_type')
    .limit(100)

  if (!data) return []

  const types = [...new Set(data.map(d => d.entity_type))]
  return types.sort()
}

// Helper function to create audit log (used by other actions)
export async function createAuditLog(params: {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}) {
  const supabase = await createClient()

  await supabase.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    old_values: params.oldValues,
    new_values: params.newValues,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  })
}
```

### 9.2 Create Logs Page

**app/(backoffice)/logs/page.tsx**
```typescript
import { Suspense } from 'react'
import { getAuditLogs, getAuditLogActions, getAuditLogEntityTypes } from '@/lib/actions/audit'
import { AuditLogsTable } from '@/components/backoffice/audit-logs-table'
import { AuditLogsFilters } from '@/components/backoffice/audit-logs-filters'

export default async function LogsPage({
  searchParams,
}: {
  searchParams: {
    action?: string
    entityType?: string
    startDate?: string
    endDate?: string
    page?: string
  }
}) {
  const page = parseInt(searchParams.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  const [{ logs, total }, actions, entityTypes] = await Promise.all([
    getAuditLogs({
      action: searchParams.action,
      entityType: searchParams.entityType,
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      limit,
      offset,
    }),
    getAuditLogActions(),
    getAuditLogEntityTypes(),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Logs de Auditoría</h1>

      <AuditLogsFilters
        actions={actions}
        entityTypes={entityTypes}
        currentFilters={searchParams}
      />

      <Suspense fallback={<div>Cargando...</div>}>
        <AuditLogsTable
          logs={logs}
          currentPage={page}
          totalPages={totalPages}
          total={total}
        />
      </Suspense>
    </div>
  )
}
```

### 9.3 Create UI Components

**components/backoffice/audit-logs-table.tsx**
```typescript
'use client'

import { AuditLogEntry } from '@/lib/actions/audit'
import { formatDate } from '@/lib/utils'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  EXECUTE: 'bg-purple-100 text-purple-800',
  APPROVE: 'bg-emerald-100 text-emerald-800',
  REJECT: 'bg-orange-100 text-orange-800',
}

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.includes(key)) return color
  }
  return 'bg-slate-100 text-slate-800'
}

export function AuditLogsTable({
  logs,
  currentPage,
  totalPages,
  total,
}: {
  logs: AuditLogEntry[]
  currentPage: number
  totalPages: number
  total: number
}) {
  const searchParams = useSearchParams()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `/backoffice/logs?${params.toString()}`
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {formatDate(log.created_at)}
                </TableCell>
                <TableCell>
                  {log.user ? (
                    <div>
                      <p className="font-medium">{log.user.full_name}</p>
                      <p className="text-xs text-slate-500">{log.user.email}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400">Sistema</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {log.entity_type}
                    {log.entity_id && (
                      <span className="text-slate-400 ml-1">
                        #{log.entity_id.slice(0, 8)}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalle del Log</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Acción</p>
                            <p className="font-medium">{log.action}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Entidad</p>
                            <p className="font-medium">{log.entity_type}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">ID Entidad</p>
                            <p className="font-mono text-xs">{log.entity_id || '-'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Fecha</p>
                            <p>{formatDate(log.created_at)}</p>
                          </div>
                        </div>
                        {log.old_values && (
                          <div>
                            <p className="text-slate-500 text-sm mb-1">Valores Anteriores</p>
                            <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto">
                              {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.new_values && (
                          <div>
                            <p className="text-slate-500 text-sm mb-1">Valores Nuevos</p>
                            <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto">
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Mostrando {logs.length} de {total} registros
        </p>
        <div className="flex items-center gap-2">
          <Link href={createPageUrl(currentPage - 1)}>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Link href={createPageUrl(currentPage + 1)}>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**components/backoffice/audit-logs-filters.tsx**
- Action selector dropdown
- Entity type selector
- Date range picker
- Clear filters button

### 9.4 Audit Log Actions Reference

Ensure all these actions are logged throughout the app:

| Action | Entity | When |
|--------|--------|------|
| `CREATE_USER` | user | User created |
| `UPDATE_USER` | user | User profile updated |
| `BLOCK_USER` | user | User blocked |
| `UNBLOCK_USER` | user | User unblocked |
| `SEND_INVITATION` | invitation | Invitation sent |
| `ADD_INITIAL_CAPITAL` | user | Initial capital added |
| `ADD_CAPITAL_INCREMENT` | user | Capital increment added |
| `BALANCE_ADJUSTMENT` | user | Balance manually adjusted |
| `SET_YIELD_START_DATE` | user | Yield start date set |
| `EXECUTE_MONTHLY_CLOSE` | monthly_closure | Monthly close executed |
| `CREATE_WITHDRAWAL_REQUEST` | withdrawal | Withdrawal requested |
| `APPROVE_WITHDRAWAL` | withdrawal | Withdrawal approved |
| `EXECUTE_WITHDRAWAL` | withdrawal | Withdrawal executed |
| `REJECT_WITHDRAWAL` | withdrawal | Withdrawal rejected |
| `LOGIN_SUCCESS` | session | User logged in |
| `LOGIN_FAILED` | session | Login attempt failed |
| `PASSWORD_CHANGED` | user | Password changed |

---

## Files to Create

- [x] `lib/actions/audit.ts`
- [x] `app/(backoffice)/logs/page.tsx`
- [x] `components/backoffice/audit-logs-table.tsx`
- [x] `components/backoffice/audit-logs-filters.tsx`

---

## Acceptance Criteria

- [ ] All critical actions are logged
- [ ] Logs page shows paginated results
- [ ] Filters work (action, entity, date)
- [ ] Log detail modal shows old/new values
- [ ] Logs cannot be modified or deleted
- [ ] Performance is acceptable (indexed queries)

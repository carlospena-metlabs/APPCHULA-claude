import { Suspense } from 'react'
import { getAuditLogs, getAuditLogActions, getAuditLogEntityTypes } from '@/lib/actions/audit'
import { AuditLogsTable } from '@/components/backoffice/audit-logs-table'
import { AuditLogsFilters } from '@/components/backoffice/audit-logs-filters'

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string
    entityType?: string
    startDate?: string
    endDate?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  const [{ logs, total }, actions, entityTypes] = await Promise.all([
    getAuditLogs({
      action: params.action,
      entityType: params.entityType,
      startDate: params.startDate,
      endDate: params.endDate,
      limit,
      offset,
    }),
    getAuditLogActions(),
    getAuditLogEntityTypes(),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Logs de Auditoria</h1>
        <p className="mt-1 text-slate-600">Historial de acciones del sistema</p>
      </div>

      <AuditLogsFilters
        actions={actions}
        entityTypes={entityTypes}
        currentFilters={{
          action: params.action,
          entityType: params.entityType,
          startDate: params.startDate,
          endDate: params.endDate,
        }}
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

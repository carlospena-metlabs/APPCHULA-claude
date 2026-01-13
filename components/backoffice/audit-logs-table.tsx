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
  ADD: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  SET: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  BLOCK: 'bg-red-100 text-red-800',
  EXECUTE: 'bg-purple-100 text-purple-800',
  APPROVE: 'bg-emerald-100 text-emerald-800',
  REJECT: 'bg-orange-100 text-orange-800',
  LOGIN: 'bg-slate-100 text-slate-800',
  LOGOUT: 'bg-slate-100 text-slate-800',
  SEND: 'bg-cyan-100 text-cyan-800',
  UNBLOCK: 'bg-emerald-100 text-emerald-800',
  ACTIVATE: 'bg-emerald-100 text-emerald-800',
  PASSWORD: 'bg-yellow-100 text-yellow-800',
}

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.toUpperCase().includes(key)) return color
  }
  return 'bg-slate-100 text-slate-800'
}

interface AuditLogsTableProps {
  logs: AuditLogEntry[]
  currentPage: number
  totalPages: number
  total: number
}

export function AuditLogsTable({
  logs,
  currentPage,
  totalPages,
  total,
}: AuditLogsTableProps) {
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
              <TableHead>Accion</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  No hay logs de auditoria
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
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
                              <p className="text-slate-500">Accion</p>
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
                            {log.user && (
                              <div className="col-span-2">
                                <p className="text-slate-500">Usuario</p>
                                <p>{log.user.full_name} ({log.user.email})</p>
                              </div>
                            )}
                          </div>
                          {log.old_values && Object.keys(log.old_values).length > 0 && (
                            <div>
                              <p className="text-slate-500 text-sm mb-1">Valores Anteriores</p>
                              <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-48">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && Object.keys(log.new_values).length > 0 && (
                            <div>
                              <p className="text-slate-500 text-sm mb-1">Valores Nuevos</p>
                              <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-48">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
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
              Pagina {currentPage} de {totalPages}
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
      )}
    </div>
  )
}

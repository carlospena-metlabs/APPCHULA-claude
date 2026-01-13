'use server'

import { createClient } from '@/lib/supabase/server'

export interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: {
    full_name: string
    email: string
  } | null
}

export interface AuditLogFilters {
  action?: string
  entityType?: string
  userId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export async function getAuditLogs(
  filters?: AuditLogFilters
): Promise<{ logs: AuditLogEntry[]; total: number }> {
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
    .limit(1000)

  if (!data) return []

  const actions = [...new Set(data.map((d) => d.action))]
  return actions.sort()
}

export async function getAuditLogEntityTypes(): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('audit_logs')
    .select('entity_type')
    .limit(1000)

  if (!data) return []

  const types = [...new Set(data.map((d) => d.entity_type))]
  return types.sort()
}

export async function createAuditLog(params: {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
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

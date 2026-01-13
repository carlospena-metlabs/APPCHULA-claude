'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

interface AuditLogsFiltersProps {
  actions: string[]
  entityTypes: string[]
  currentFilters: {
    action?: string
    entityType?: string
    startDate?: string
    endDate?: string
  }
}

export function AuditLogsFilters({
  actions,
  entityTypes,
  currentFilters,
}: AuditLogsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/backoffice/logs?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/backoffice/logs')
  }

  const hasFilters = currentFilters.action || currentFilters.entityType || currentFilters.startDate || currentFilters.endDate

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="action">Accion</Label>
          <Select
            value={currentFilters.action || 'all'}
            onValueChange={(value) => updateFilter('action', value === 'all' ? null : value)}
          >
            <SelectTrigger id="action">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {actions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entityType">Entidad</Label>
          <Select
            value={currentFilters.entityType || 'all'}
            onValueChange={(value) => updateFilter('entityType', value === 'all' ? null : value)}
          >
            <SelectTrigger id="entityType">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Desde</Label>
          <Input
            id="startDate"
            type="date"
            value={currentFilters.startDate || ''}
            onChange={(e) => updateFilter('startDate', e.target.value || null)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Hasta</Label>
          <Input
            id="endDate"
            type="date"
            value={currentFilters.endDate || ''}
            onChange={(e) => updateFilter('endDate', e.target.value || null)}
          />
        </div>

        <div className="flex items-end">
          {hasFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const statuses = [
  { value: 'todos', label: 'Todos' },
  { value: 'solicitado', label: 'Solicitados' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'ejecutado', label: 'Ejecutados' },
  { value: 'rechazado', label: 'Rechazados' },
]

interface WithdrawalsFiltersProps {
  currentStatus: string
}

export function WithdrawalsFilters({ currentStatus }: WithdrawalsFiltersProps) {
  const router = useRouter()

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams()
    if (status !== 'todos') {
      params.set('status', status)
    }
    router.push(`/backoffice/retiros?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 bg-white p-4 rounded-lg border">
      {statuses.map((status) => (
        <Button
          key={status.value}
          variant={currentStatus === status.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange(status.value)}
        >
          {status.label}
        </Button>
      ))}
    </div>
  )
}

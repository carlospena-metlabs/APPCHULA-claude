import { Suspense } from 'react'
import Link from 'next/link'
import { getUsers } from '@/lib/actions/users'
import { Button } from '@/components/ui/button'
import { UsersTable } from '@/components/backoffice/users-table'
import { UsersFilters } from '@/components/backoffice/users-filters'
import { Plus } from 'lucide-react'
import { UserType, UserStatus } from '@/types'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; search?: string }>
}) {
  const params = await searchParams
  const users = await getUsers({
    type: params.type as UserType | undefined,
    status: params.status as UserStatus | undefined,
    search: params.search,
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

      <Suspense fallback={<div>Cargando filtros...</div>}>
        <UsersFilters />
      </Suspense>

      <Suspense fallback={<div>Cargando usuarios...</div>}>
        <UsersTable users={users} />
      </Suspense>
    </div>
  )
}

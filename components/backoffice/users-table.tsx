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

const statusColors: Record<string, string> = {
  activo: 'bg-green-100 text-green-800',
  no_verificado: 'bg-yellow-100 text-yellow-800',
  bloqueado: 'bg-red-100 text-red-800',
}

const typeLabels: Record<string, string> = {
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
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                No hay usuarios
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

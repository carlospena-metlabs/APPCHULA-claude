'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import { formatCurrency, formatDate, GUARANTEED_PERCENTAGES } from '@/lib/utils'
import { updateUser, blockUser, unblockUser, sendInvitation } from '@/lib/actions/users'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Ban, CheckCircle, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AddCapitalDialog } from './add-capital-dialog'
import { AdjustBalanceDialog } from './adjust-balance-dialog'
import { CapitalMovementsTable } from './capital-movements-table'
import { SetYieldDateDialog } from './set-yield-date-dialog'
import { CapitalMovement } from '@/types'

interface AgentOption {
  id: string
  full_name: string
  email: string
}

interface UserWithRelations extends User {
  agent?: AgentOption | null
  super_agent?: AgentOption | null
}

export function UserDetail({
  user,
  currentUser,
  agents,
  superAgents,
  capitalMovements = [],
}: {
  user: UserWithRelations
  currentUser: User
  agents: AgentOption[]
  superAgents: AgentOption[]
  capitalMovements?: CapitalMovement[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const isAdmin = currentUser.is_admin
  const canEdit = isAdmin

  // Calculate total yields from capital movements (only 'rendimiento' type)
  const totalYields = capitalMovements
    .filter(m => m.type === 'rendimiento')
    .reduce((sum, m) => sum + m.amount, 0)

  async function handleUpdate(formData: FormData) {
    setError(null)
    setSuccess(null)
    formData.append('id', user.id)
    const result = await updateUser(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Usuario actualizado correctamente')
      setIsEditing(false)
      router.refresh()
    }
  }

  async function handleBlock() {
    setError(null)
    const result = user.status === 'bloqueado'
      ? await unblockUser(user.id)
      : await blockUser(user.id)

    if (result.error) {
      setError(result.error)
    } else {
      setShowBlockDialog(false)
      router.refresh()
    }
  }

  async function handleSendInvitation() {
    setError(null)
    setInvitationUrl(null)
    const result = await sendInvitation(user.id)

    if (result.error) {
      setError(result.error)
    } else if (result.activationUrl) {
      setInvitationUrl(result.activationUrl)
    }
  }

  const statusColors: Record<string, string> = {
    activo: 'bg-green-100 text-green-800',
    no_verificado: 'bg-yellow-100 text-yellow-800',
    bloqueado: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/backoffice/usuarios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.full_name}</h1>
            <p className="text-slate-600">{user.email}</p>
          </div>
          <Badge className={statusColors[user.status]}>{user.status}</Badge>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            {!user.activated_at && (
              <Button variant="outline" onClick={handleSendInvitation}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar invitacion
              </Button>
            )}
            <Button
              variant={user.status === 'bloqueado' ? 'default' : 'destructive'}
              onClick={() => setShowBlockDialog(true)}
            >
              {user.status === 'bloqueado' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Desbloquear
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Bloquear
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {invitationUrl && (
        <Alert>
          <AlertDescription>
            <p className="font-medium mb-2">Enlace de activacion generado:</p>
            <code className="block p-2 bg-slate-100 rounded text-sm break-all">
              {invitationUrl}
            </code>
            <p className="text-sm text-slate-500 mt-2">
              Este enlace expira en 24 horas. Envialo al usuario.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Datos del usuario</CardTitle>
              {canEdit && !isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form action={handleUpdate} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nombre completo</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        defaultValue={user.full_name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={user.phone || ''}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="user_type">Tipo de usuario</Label>
                      <Select name="user_type" defaultValue={user.user_type}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cliente">Cliente</SelectItem>
                          <SelectItem value="agente">Agente</SelectItem>
                          <SelectItem value="super_agente">Super Agente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guaranteed_percentage">Porcentaje garantizado</Label>
                      <Select
                        name="guaranteed_percentage"
                        defaultValue={user.guaranteed_percentage.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GUARANTEED_PERCENTAGES.map((pct) => (
                            <SelectItem key={pct} value={pct.toString()}>
                              {pct}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="agent_id">Agente asignado</Label>
                      <Select name="agent_id" defaultValue={user.agent_id || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin agente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin agente</SelectItem>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="super_agent_id">Super Agente</Label>
                      <Select name="super_agent_id" defaultValue={user.super_agent_id || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin super agente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin super agente</SelectItem>
                          {superAgents.map((sa) => (
                            <SelectItem key={sa.id} value={sa.id}>
                              {sa.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Guardar cambios</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-slate-500">Tipo</dt>
                    <dd className="font-medium capitalize">{user.user_type.replace('_', ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Telefono</dt>
                    <dd className="font-medium">{user.phone || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Agente</dt>
                    <dd className="font-medium">{user.agent?.full_name || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Super Agente</dt>
                    <dd className="font-medium">{user.super_agent?.full_name || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Porcentaje garantizado</dt>
                    <dd className="font-medium">{user.guaranteed_percentage}%</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Activado</dt>
                    <dd className="font-medium">
                      {user.activated_at ? formatDate(user.activated_at) : 'No activado'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Creado</dt>
                    <dd className="font-medium">{formatDate(user.created_at)}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resumen financiero</CardTitle>
              {isAdmin && (
                <div className="flex gap-2">
                  <AddCapitalDialog
                    userId={user.id}
                    currentBalance={user.current_balance}
                    hasInitialCapital={user.initial_capital > 0}
                  />
                  <AdjustBalanceDialog
                    userId={user.id}
                    currentBalance={user.current_balance}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-slate-500">Capital inicial</dt>
                  <dd className="text-2xl font-bold">{formatCurrency(user.initial_capital)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Balance actual</dt>
                  <dd className="text-2xl font-bold text-green-600">
                    {formatCurrency(user.current_balance)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Rendimiento total</dt>
                  <dd className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalYields)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fecha de inicio de rendimientos</CardTitle>
              {isAdmin && (
                <SetYieldDateDialog
                  userId={user.id}
                  currentYieldDate={user.yield_start_date}
                />
              )}
            </CardHeader>
            <CardContent>
              {user.yield_start_date ? (
                <p className="text-lg">{formatDate(user.yield_start_date)}</p>
              ) : (
                <p className="text-slate-500">No establecida</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de movimientos de capital</CardTitle>
            </CardHeader>
            <CardContent>
              <CapitalMovementsTable movements={capitalMovements} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.status === 'bloqueado' ? 'Desbloquear usuario' : 'Bloquear usuario'}
            </DialogTitle>
            <DialogDescription>
              {user.status === 'bloqueado'
                ? `Esta seguro de que desea desbloquear a ${user.full_name}? El usuario podra acceder nuevamente a la plataforma.`
                : `Esta seguro de que desea bloquear a ${user.full_name}? El usuario no podra acceder a la plataforma.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={user.status === 'bloqueado' ? 'default' : 'destructive'}
              onClick={handleBlock}
            >
              {user.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

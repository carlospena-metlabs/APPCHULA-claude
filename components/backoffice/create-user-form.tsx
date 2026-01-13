'use client'

import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '@/lib/actions/users'
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
import { Card, CardContent } from '@/components/ui/card'
import { GUARANTEED_PERCENTAGES } from '@/lib/utils'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creando...' : 'Crear Usuario'}
    </Button>
  )
}

interface AgentOption {
  id: string
  full_name: string
  email: string
}

export function CreateUserForm({
  agents,
  superAgents,
}: {
  agents: AgentOption[]
  superAgents: AgentOption[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [userType, setUserType] = useState<string>('cliente')

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createUser(formData)

    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      router.push(`/backoffice/usuarios/${result.userId}`)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input
                id="full_name"
                name="full_name"
                required
                placeholder="Juan Perez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="juan@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_type">Tipo de usuario *</Label>
              <Select
                name="user_type"
                value={userType}
                onValueChange={setUserType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="agente">Agente</SelectItem>
                  <SelectItem value="super_agente">Super Agente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guaranteed_percentage">Porcentaje garantizado *</Label>
              <Select name="guaranteed_percentage" defaultValue="2.5">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar porcentaje" />
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

            <div className="space-y-2">
              <Label htmlFor="initial_capital">Capital inicial (USD)</Label>
              <Input
                id="initial_capital"
                name="initial_capital"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                placeholder="0.00"
              />
            </div>
          </div>

          {userType === 'cliente' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agent_id">Agente asignado</Label>
                <Select name="agent_id">
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
                <Label htmlFor="super_agent_id">Super Agente asignado</Label>
                <Select name="super_agent_id">
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
          )}

          {userType === 'agente' && (
            <div className="space-y-2">
              <Label htmlFor="super_agent_id">Super Agente supervisor</Label>
              <Select name="super_agent_id">
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
          )}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}

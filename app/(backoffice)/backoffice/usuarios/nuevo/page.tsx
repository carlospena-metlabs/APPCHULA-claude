import { getAgents, getSuperAgents } from '@/lib/actions/users'
import { CreateUserForm } from '@/components/backoffice/create-user-form'

export default async function NewUserPage() {
  const [agents, superAgents] = await Promise.all([
    getAgents(),
    getSuperAgents(),
  ])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Nuevo Usuario</h1>
      <CreateUserForm agents={agents} superAgents={superAgents} />
    </div>
  )
}

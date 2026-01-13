import { notFound } from 'next/navigation'
import { getUser, getAgents, getSuperAgents } from '@/lib/actions/users'
import { getCurrentUser } from '@/lib/actions/auth'
import { getCapitalMovements } from '@/lib/actions/capital'
import { UserDetail } from '@/components/backoffice/user-detail'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [user, currentUser, agents, superAgents, capitalMovements] = await Promise.all([
    getUser(id).catch(() => null),
    getCurrentUser(),
    getAgents(),
    getSuperAgents(),
    getCapitalMovements(id),
  ])

  if (!user) {
    notFound()
  }

  return (
    <UserDetail
      user={user}
      currentUser={currentUser!}
      agents={agents}
      superAgents={superAgents}
      capitalMovements={capitalMovements}
    />
  )
}

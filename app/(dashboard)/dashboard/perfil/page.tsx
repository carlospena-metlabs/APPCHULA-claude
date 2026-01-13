import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { ProfileCard } from '@/components/dashboard/profile-card'

export default async function PerfilPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="mt-1 text-muted-foreground">
          Informacion de tu cuenta
        </p>
      </div>

      <ProfileCard user={user} />
    </div>
  )
}

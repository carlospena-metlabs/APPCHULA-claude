import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { BackofficeSidebar } from '@/components/backoffice/sidebar'
import { BackofficeHeader } from '@/components/backoffice/header'

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!user.is_admin && !user.is_operator) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <BackofficeSidebar user={user} />
      <div className="lg:pl-64">
        <BackofficeHeader user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Redirect admin/operators to backoffice
  if (user.is_admin || user.is_operator) {
    redirect('/backoffice')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar user={user} />
      <div className="lg:pl-64">
        <DashboardHeader user={user} />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User } from '@/types'
import {
  LayoutDashboard,
  TrendingUp,
  ArrowDownToLine,
  UserCircle,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Rendimientos', href: '/dashboard/rendimientos', icon: TrendingUp },
  { name: 'Retiros', href: '/dashboard/retiros', icon: ArrowDownToLine },
  { name: 'Perfil', href: '/dashboard/perfil', icon: UserCircle },
]

export function DashboardSidebar({ user }: { user: User }) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-slate-900 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <span className="text-xl font-bold text-white">APPCHULA</span>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            {user.full_name}
          </p>
          <p className="text-xs text-slate-500 capitalize">
            {user.user_type.replace('_', ' ')}
          </p>
        </div>
      </div>
    </div>
  )
}

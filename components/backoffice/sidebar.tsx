'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User } from '@/types'
import {
  Users,
  Calculator,
  ArrowDownToLine,
  FileText,
  Home,
  LogOut,
} from 'lucide-react'
import { logout } from '@/lib/actions/auth'

const navigation = [
  { name: 'Dashboard', href: '/backoffice', icon: Home },
  { name: 'Usuarios', href: '/backoffice/usuarios', icon: Users },
  { name: 'Cierre Mensual', href: '/backoffice/cierre-mensual', icon: Calculator },
  { name: 'Retiros', href: '/backoffice/retiros', icon: ArrowDownToLine },
  { name: 'Logs', href: '/backoffice/logs', icon: FileText },
]

export function BackofficeSidebar({ user }: { user: User }) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-sidebar pt-5 pb-4 overflow-y-auto border-r border-sidebar-border">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold text-foreground">APPCHULA</span>
          </div>
          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-md font-medium">
            Backoffice
          </span>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/backoffice' && pathname.startsWith(item.href))

            // Operators can't access Cierre Mensual
            if (item.href === '/backoffice/cierre-mensual' && !user.is_admin) {
              return null
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-primary border border-primary/20'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Logout button */}
        <div className="px-3 mb-4">
          <button
            onClick={() => logout()}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Log out
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <p className="text-sm text-foreground">
            {user.full_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {user.is_admin ? 'Administrador' : 'Operador'}
          </p>
        </div>
      </div>
    </div>
  )
}

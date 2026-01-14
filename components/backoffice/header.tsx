'use client'

import { User } from '@/types'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User as UserIcon } from 'lucide-react'

export function BackofficeHeader({ user }: { user: User }) {
  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Backoffice</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem disabled className="text-muted-foreground">
              <UserIcon className="mr-2 h-4 w-4" />
              {user.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()} className="text-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

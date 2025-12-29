/**
 * Sidebar Component
 * Navigation sidebar for admin panel
 */

import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  HelpCircle,
  Users,
  Trophy,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'

/**
 * Navigation menu items configuration
 */
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Layers, label: 'Levels', path: '/levels' },
  { icon: HelpCircle, label: 'Questions', path: '/questions' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export const Sidebar = () => {
  const location = useLocation()
  const { logout, admin } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo section */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Hrashwa-Dirga</h1>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-secondary'
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Admin info and logout */}
      <div className="p-4">
        <div className="mb-3 rounded-lg bg-muted p-3">
          <p className="text-sm font-medium">{admin?.email}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
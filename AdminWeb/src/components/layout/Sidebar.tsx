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
  X,
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

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

interface SidebarContentProps {
  onNavigate?: () => void
}

const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  const location = useLocation()
  const { logout, admin } = useAuth()

  return (
    <>
      {/* Logo section */}
      <div className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <h1 className="truncate text-xl font-bold">Hrashwa-Dirga</h1>
        {onNavigate && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={onNavigate}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link key={item.path} to={item.path} onClick={onNavigate}>
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
        <div className="mb-3 min-w-0 rounded-lg bg-muted p-3">
          <p className="truncate text-sm font-medium">{admin?.email}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => {
            onNavigate?.()
            logout()
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  )
}

export const Sidebar = ({
  isMobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) => {
  const closeMobileSidebar = () => onMobileOpenChange?.(false)

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-card md:flex">
        <SidebarContent />
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={closeMobileSidebar}
            aria-label="Close navigation"
          />
          <aside className="relative z-10 flex h-full w-[min(18rem,calc(100vw-3rem))] flex-col border-r bg-card shadow-xl">
            <SidebarContent onNavigate={closeMobileSidebar} />
          </aside>
        </div>
      )}
    </>
  )
}

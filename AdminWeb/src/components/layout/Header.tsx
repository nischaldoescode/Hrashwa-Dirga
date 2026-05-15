/**
 * Header Component
 * Top header bar with breadcrumbs and actions
 */

import { useLocation } from 'react-router-dom'
import { ChevronRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Get page title from current route
 */
const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/': 'Dashboard',
    '/levels': 'Levels',
    '/questions': 'Questions',
    '/users': 'Users',
    '/leaderboard': 'Leaderboard',
    '/settings': 'Settings',
  }
  return routes[pathname] || 'Admin Panel'
}

interface HeaderProps {
  onMenuClick: () => void
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-card px-4 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>
      <div className="flex min-w-0 items-center space-x-2 text-sm text-muted-foreground">
        <span>Admin</span>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate font-medium text-foreground">{pageTitle}</span>
      </div>
    </header>
  )
}

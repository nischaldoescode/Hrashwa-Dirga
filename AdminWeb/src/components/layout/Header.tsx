/**
 * Header Component
 * Top header bar with breadcrumbs and actions
 */

import { useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

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

export const Header = () => {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <header className="flex h-16 items-center border-b bg-card px-6">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Admin</span>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{pageTitle}</span>
      </div>
    </header>
  )
}
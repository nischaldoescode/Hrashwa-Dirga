/**
 * Layout Component
 * Main layout wrapper with sidebar and header
 */

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        isMobileOpen={isSidebarOpen}
        onMobileOpenChange={setIsSidebarOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-background p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

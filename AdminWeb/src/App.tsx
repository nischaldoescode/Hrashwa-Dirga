/**
 * Main App Component
 * Root component with routing and authentication
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Levels } from '@/pages/Levels'
import { Questions } from '@/pages/Questions'
import { Users } from '@/pages/Users'
import { Leaderboard } from '@/pages/Leaderboard'
import { Settings } from '@/pages/Settings'

/**
 * Create React Query client
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
})

/**
 * Protected route wrapper
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/**
 * App component with routing
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="levels" element={<Levels />} />
            <Route path="questions" element={<Questions />} />
            <Route path="users" element={<Users />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}

export default App
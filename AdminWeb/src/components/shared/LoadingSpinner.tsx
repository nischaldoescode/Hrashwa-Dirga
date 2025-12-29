/**
 * Loading Spinner Component
 * Full page loading indicator
 */

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
}

export const LoadingSpinner = ({ message = 'Loading...' }: LoadingSpinnerProps) => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
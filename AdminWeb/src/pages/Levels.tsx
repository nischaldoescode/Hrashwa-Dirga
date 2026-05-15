/**
 * Levels Page
 * Manage game levels with CRUD operations
 */

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LevelTable } from '@/components/levels/LevelTable'
import { LevelDialog } from '@/components/levels/LevelDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useLevels } from '@/hooks/useLevels'
import { Layers } from 'lucide-react'

export const Levels = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { data: levels, isLoading } = useLevels()

  if (isLoading) {
    return <LoadingSpinner message="Loading levels..." />
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Levels</h1>
          <p className="text-muted-foreground">
            Manage game levels and their configuration
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Level
        </Button>
      </div>

      {/* Levels table */}
      {levels && levels.length > 0 ? (
        <LevelTable levels={levels} />
      ) : (
        <EmptyState
          icon={Layers}
          title="No levels found"
          description="Get started by creating your first level. Levels organize questions into progressive difficulty tiers."
          actionLabel="Create First Level"
          onAction={() => setIsCreateDialogOpen(true)}
        />
      )}

      {/* Create level dialog */}
      <LevelDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}

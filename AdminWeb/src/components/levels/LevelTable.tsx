/**
 * Level Table Component
 * Displays all levels in a table with actions
 */

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, } from 'lucide-react'
import type { Level } from '@/types'
import { formatDate } from '@/lib/utils'
import { LevelDialog } from './LevelDialog'
import { DeleteDialog } from '../shared/DeleteDialog'
import { useDeleteLevel } from '@/hooks/useLevels'

interface LevelTableProps {
  levels: Level[]
}

export const LevelTable = ({ levels }: LevelTableProps) => {
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [deletingLevelId, setDeletingLevelId] = useState<string | null>(null)
  const deleteMutation = useDeleteLevel()

  /**
   * Handle level deletion
   */
  const handleDelete = () => {
    if (deletingLevelId) {
      deleteMutation.mutate(deletingLevelId, {
        onSuccess: () => setDeletingLevelId(null),
      })
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Level</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-32">Questions</TableHead>
              <TableHead className="w-32">Order</TableHead>
              <TableHead className="w-48">Created</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No levels found. Create your first level to get started.
                </TableCell>
              </TableRow>
            ) : (
              levels.map((level) => (
                <TableRow key={level._id}>
                  <TableCell className="font-bold">{level.levelNumber}</TableCell>
                  <TableCell className="font-medium">{level.levelName}</TableCell>
                  <TableCell>
                    <Badge variant={level.isPublished ? 'default' : 'secondary'}>
                      {level.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{level.questionCount || 0}</Badge>
                  </TableCell>
                  <TableCell>{level.displayOrder}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(level.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit level ${level.levelNumber}`}
                        onClick={() => setEditingLevel(level)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete level ${level.levelNumber}`}
                        onClick={() => setDeletingLevelId(level._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit level dialog */}
      {editingLevel && (
        <LevelDialog
          level={editingLevel}
          open={!!editingLevel}
          onOpenChange={(open) => !open && setEditingLevel(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={!!deletingLevelId}
        onOpenChange={(open) => !open && setDeletingLevelId(null)}
        onConfirm={handleDelete}
        title="Delete Level"
        description="This will permanently delete this level and all associated questions. This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}

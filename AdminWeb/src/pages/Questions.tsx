/**
 * Questions Page
 * Manage questions with CRUD operations
 */

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, HelpCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuestionTable } from '@/components/question/QuestionTable'
import { QuestionDialog } from '@/components/question/QuestionDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useQuestions } from '@/hooks/useQuestions'
import { PAGINATION } from '@/lib/constants'

export const Questions = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [page, setPage] = useState(PAGINATION.DEFAULT_PAGE)
  const limit = PAGINATION.DEFAULT_LIMIT
  const { data, isLoading, isFetching } = useQuestions(page, limit)
  const pagination = data?.pagination
  const totalPages = pagination?.totalPages || 1
  const totalCount = pagination?.totalCount || 0
  const displayedPage = pagination?.currentPage || page
  const startItem = totalCount === 0 ? 0 : (displayedPage - 1) * limit + 1
  const endItem = Math.min(displayedPage * limit, totalCount)
  const canGoPrevious = page > 1
  const canGoNext = page < totalPages

  useEffect(() => {
    if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [page, pagination])

  if (isLoading) {
    return <LoadingSpinner message="Loading questions..." />
  }

  const questions = data?.questions || []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Questions</h1>
          <p className="text-muted-foreground">
            Create and manage questions for all levels
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Question
        </Button>
      </div>

      {/* Questions table */}
      {questions.length > 0 ? (
        <>
          <QuestionTable questions={questions} />

          <div className="flex flex-col gap-3 rounded-md border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startItem}-{endItem} of {totalCount} questions
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-center text-sm font-medium">
                Page {displayedPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={!canGoPrevious || isFetching}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={!canGoNext || isFetching}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={HelpCircle}
          title="No questions found"
          description="Start by creating questions for your levels. Each question should have exactly 3 options with one correct answer."
          actionLabel="Create First Question"
          onAction={() => setIsCreateDialogOpen(true)}
        />
      )}

      {/* Create question dialog */}
      <QuestionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}

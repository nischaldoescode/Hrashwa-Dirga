/**
 * Questions Page
 * Manage questions with CRUD operations
 */

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuestionTable } from '@/components/question/QuestionTable'
import { QuestionDialog } from '@/components/question/QuestionDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useQuestions } from '@/hooks/useQuestions'
import { HelpCircle } from 'lucide-react'

export const Questions = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { data, isLoading } = useQuestions()

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
        <QuestionTable questions={questions} />
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

/**
 * Question Table Component
 * Displays all questions in a table with actions
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
import { Edit, Trash2 } from 'lucide-react'
import type { Question } from '@/types'
import { truncate } from '@/lib/utils'
import { QuestionDialog } from './QuestionDialog'
import { DeleteDialog } from '../shared/DeleteDialog'
import { useDeleteQuestion } from '@/hooks/useQuestions'

interface QuestionTableProps {
  questions: Question[]
}


export const QuestionTable = ({ questions }: QuestionTableProps) => {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)
  const deleteMutation = useDeleteQuestion()

  /**
   * Handle question deletion
   */
  const handleDelete = () => {
    if (deletingQuestionId) {
      deleteMutation.mutate(deletingQuestionId, {
        onSuccess: () => setDeletingQuestionId(null),
      })
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead className="w-32">Level</TableHead>
              <TableHead className="w-24">Difficulty</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32">Success Rate</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No questions found. Create your first question to get started.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow key={question._id}>
                  <TableCell className="font-medium max-w-md">
                    {truncate(question.questionText, 60)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      Level {question.levelId.levelNumber}
                    </Badge>
                  </TableCell>
                  <TableCell>
                  </TableCell>
                  <TableCell>
                    <Badge variant={question.isActive ? 'default' : 'secondary'}>
                      {question.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {question.successRate ? (
                      <span className="font-medium">{question.successRate}%</span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit question ${question.questionText}`}
                        onClick={() => setEditingQuestion(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete question ${question.questionText}`}
                        onClick={() => setDeletingQuestionId(question._id)}
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

      {/* Edit question dialog */}
      {editingQuestion && (
        <QuestionDialog
          question={editingQuestion}
          open={!!editingQuestion}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={!!deletingQuestionId}
        onOpenChange={(open) => !open && setDeletingQuestionId(null)}
        onConfirm={handleDelete}
        title="Delete Question"
        description="This will permanently delete this question. This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}

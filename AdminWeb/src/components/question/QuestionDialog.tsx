/**
 * Question Dialog Component
 * Form dialog for creating and editing questions
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types";
import { useCreateQuestion, useUpdateQuestion } from "@/hooks/useQuestions";
import { useLevels } from "@/hooks/useLevels";
import { DialogDescription } from "@radix-ui/react-dialog";

/**
 * Form validation schema
 */
const questionSchema = z.object({
  levelId: z.string().min(1, "Level is required"),
  questionText: z.string().min(1, "Question text is required"),
  option1: z.string().min(1, "Option 1 is required"),
  option2: z.string().min(1, "Option 2 is required"),
  option3: z.string().min(1, "Option 3 is required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  orderInLevel: z.coerce.number().min(0).optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuestionDialogProps {
  question?: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuestionDialog = ({
  question,
  open,
  onOpenChange,
}: QuestionDialogProps) => {
  const isEditing = !!question;
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const { data: levels } = useLevels();

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema) as any,
    defaultValues: {
      levelId: "",
      questionText: "",
      option1: "",
      option2: "",
      option3: "",
      correctAnswer: "",
      orderInLevel: 0,
    },
  }) as ReturnType<typeof useForm<QuestionFormValues>>;

  /**
   * Load question data when editing
   */
  useEffect(() => {
    if (question) {
      form.reset({
        levelId: question.levelId._id,
        questionText: question.questionText,
        option1: question.options[0] || "",
        option2: question.options[1] || "",
        option3: question.options[2] || "",
        correctAnswer: question.correctAnswer,
        orderInLevel: question.orderInLevel,
      });
    } else {
      form.reset({
        levelId: "",
        questionText: "",
        option1: "",
        option2: "",
        option3: "",
        correctAnswer: "",
        orderInLevel: 0,
      });
    }
  }, [question, form]);

  /**
   * Handle form submission
   */
  const onSubmit = (data: QuestionFormValues) => {
    const { option1, option2, option3, ...rest } = data;
    const questionData = {
      ...rest,
      options: [option1, option2, option3] as [string, string, string],
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: question._id, data: questionData },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createMutation.mutate(questionData, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Question" : "Create New Question"}
          </DialogTitle>
          <DialogDescription>
            {question
              ? "Update question details, options, and correct answer."
              : "Create a new question with exactly 3 options and one correct answer."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="levelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {levels?.map((level) => (
                        <SelectItem key={level._id} value={level._id}>
                          Level {level.levelNumber} - {level.levelName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the question"
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Options (3 required)</FormLabel>
              <FormField
                control={form.control}
                name="option1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Option 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="option2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Option 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="option3"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Option 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correct Answer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Must match one of the options exactly"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">

              <FormField
                control={form.control}
                name="orderInLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order in Level</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Update" : "Create"} Question
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Level Dialog Component
 * Form dialog for creating and editing levels
 */

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Level } from "@/types";
import { useCreateLevel, useUpdateLevel } from "@/hooks/useLevels";
import { useLevels } from "@/hooks/useLevels";

/**
 * Form validation schema
 */
const levelSchema = z.object({
  levelNumber: z.coerce.number().min(1, "Level number must be at least 1"),
  levelName: z.string().min(1, "Level name is required"),
  isPublished: z.boolean(),
});

type LevelFormValues = z.infer<typeof levelSchema>;

interface LevelDialogProps {
  level?: Level | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LevelDialog = ({
  level,
  open,
  onOpenChange,
}: LevelDialogProps) => {
  const isEditing = !!level;
  const createMutation = useCreateLevel();
  const updateMutation = useUpdateLevel();
  const { data: existingLevels } = useLevels();

  // Calculate next available level number
  const nextLevelNumber =
    existingLevels && existingLevels.length > 0
      ? Math.max(...existingLevels.map((l) => l.levelNumber)) + 1
      : 1;

  const form = useForm<LevelFormValues>({
    resolver: zodResolver(levelSchema) as Resolver<LevelFormValues>,
    defaultValues: level
      ? {
          levelNumber: level.levelNumber,
          levelName: level.levelName,
          isPublished: level.isPublished,
        }
      : {
          levelNumber: nextLevelNumber,
          levelName: "",
          isPublished: true,
        },
  });

  /**
   * Load level data when editing
   */
  useEffect(() => {
    if (level) {
      form.reset({
        levelNumber: level.levelNumber,
        levelName: level.levelName,
        isPublished: level.isPublished,
      });
    } else {
      form.reset({
        levelNumber: nextLevelNumber,
        levelName: "",
        isPublished: true,
      });
    }
  }, [level, form, nextLevelNumber]);

  /**
   * Handle form submission
   */
  const onSubmit = (data: LevelFormValues) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: level._id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Level" : "Create New Level"}
          </DialogTitle>
          <DialogDescription>
            Create a new level to organize questions into progressive difficulty
            tiers.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="levelNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={nextLevelNumber.toString()}
                      disabled={!!level}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    {!level && `Next available: Level ${nextLevelNumber}`}
                    {level && "Level number cannot be changed"}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="levelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Beginner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Published</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Make this level visible to users
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Update" : "Create"} Level
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

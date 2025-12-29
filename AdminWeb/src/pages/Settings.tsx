/**
 * Settings Page
 * Manage app configuration and settings
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getConfig, updateConfig, uploadLogo, deleteLogo } from "@/api/config";
import { QUERY_KEYS } from "@/lib/constants";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/axios";

/**
 * Settings form validation schema
 */
const settingsSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  appVersion: z.string().min(1, "Version is required"),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string(),
  initialCoins: z.coerce.number().min(0),
  dailyCoins: z.coerce.number().min(0),
  hintCost: z.coerce.number().min(0),
  levelCompletionBonus: z.coerce.number().min(0),
  baseScore: z.coerce.number().min(1),
  hintScorePenalty: z.coerce.number().min(0),
  contactEmail: z.string().email("Invalid email"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export const Settings = () => {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: QUERY_KEYS.CONFIG.APP,
    queryFn: getConfig,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      appName: "",
      appVersion: "",
      maintenanceMode: false,
      maintenanceMessage: "",
      initialCoins: 0,
      dailyCoins: 0,
      hintCost: 0,
      levelCompletionBonus: 0,
      baseScore: 1,
      hintScorePenalty: 0,
      contactEmail: "",
    },
  });

  useEffect(() => {
  if (config) {
    form.reset({
      appName: config.appName,
      appVersion: config.appVersion,
      maintenanceMode: config.maintenanceMode,
      maintenanceMessage: config.maintenanceMessage,
      initialCoins: config.gameSettings.initialCoins,
      dailyCoins: config.gameSettings.dailyCoins,
      hintCost: config.gameSettings.hintCost,
      levelCompletionBonus: config.gameSettings.levelCompletionBonus,
      baseScore: config.gameSettings.baseScore,
      hintScorePenalty: config.gameSettings.hintScorePenalty,
      contactEmail: config.contactEmail,
    })
  }
}, [config, form])

  /**
   * Update config mutation
   */
  const updateMutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONFIG.APP });
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  /**
   * Upload logo mutation
   */
  const uploadMutation = useMutation({
    mutationFn: uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONFIG.APP });
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Logo uploaded successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  /**
   * Delete logo mutation
   */
  const deleteMutation = useMutation({
    mutationFn: deleteLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONFIG.APP });
      toast.success("Logo deleted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  /**
   * Handle logo file selection
   */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handle logo upload
   */
  const handleLogoUpload = () => {
    if (logoFile) {
      uploadMutation.mutate(logoFile);
    }
  };

  /**
   * Handle settings form submission
   */
  const onSubmit = (data: SettingsFormValues) => {
    updateMutation.mutate({
      appName: data.appName,
      appVersion: data.appVersion,
      maintenanceMode: data.maintenanceMode,
      maintenanceMessage: data.maintenanceMessage,
      gameSettings: {
        initialCoins: data.initialCoins,
        dailyCoins: data.dailyCoins,
        hintCost: data.hintCost,
        levelCompletionBonus: data.levelCompletionBonus,
        maxHintsPerQuestion: 2,
        baseScore: data.baseScore,
        hintScorePenalty: data.hintScorePenalty,
      },
      contactEmail: data.contactEmail,
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage application configuration and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Logo management */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>App Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current logo */}
            {config?.logoUrl && !logoPreview && (
              <div className="relative">
                <img
                  src={config.logoUrl}
                  alt="App Logo"
                  className="w-full rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Logo preview */}
            {logoPreview && (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-full rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload button */}
            {!logoPreview && (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload logo
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            )}

            {/* Upload action */}
            {logoFile && (
              <Button
                className="w-full"
                onClick={handleLogoUpload}
                disabled={uploadMutation.isPending}
              >
                Upload Logo
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Configuration form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>App Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* General settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">General</h3>
                  <FormField
                    control={form.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="appVersion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Maintenance mode */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Maintenance</h3>
                  <FormField
                    control={form.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Maintenance Mode
                          </FormLabel>
                          <FormDescription>
                            Enable to show maintenance message to users
                          </FormDescription>
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

                  <FormField
                    control={form.control}
                    name="maintenanceMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maintenance Message</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Game settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Game Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initialCoins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Coins</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>First day coins</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dailyCoins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Coins</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>Subsequent days</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hintCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hint Cost</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>Coins per hint</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="levelCompletionBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level Bonus</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>Coins per level</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="baseScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Score</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Points per correct answer
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hintScorePenalty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hint Penalty</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Points lost per hint
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  Save Settings
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

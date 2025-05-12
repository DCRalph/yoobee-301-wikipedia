"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { AlertCircle, Settings2 } from "lucide-react";
import { api } from "~/trpc/react";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { TRPCClientError } from "@trpc/client";
import { handleTRPCMutation } from "~/lib/toast";

// Settings schema
const settingsSchema = z.object({
  allowRegistration: z.boolean().default(true),
  allowArticleCreation: z.boolean().default(true),
  enableAIFeatures: z.boolean().default(false),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// Default settings
const defaultSettings: SettingsFormValues = {
  allowRegistration: true,
  allowArticleCreation: true,
  enableAIFeatures: false,
};

export function SettingsForm() {
  const [settings, setSettings] = useState<SettingsFormValues>(defaultSettings);
  const [error, setError] = useState<string | null>(null);
  // const [success, setSuccess] = useState(false);

  // API hooks
  const settingsQuery = api.admin.settings.get.useQuery();
  const updateSettings = api.admin.settings.update.useMutation({
    onSuccess: () => {
      // setSuccess(true);
      // Hide success message after 3 seconds
      // setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      if (err instanceof TRPCClientError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
        console.error(err);
      }
    },
  });

  // Load settings from the API
  useEffect(() => {
    if (settingsQuery.data) {
      setSettings({
        allowRegistration: settingsQuery.data.allowRegistration,
        allowArticleCreation: settingsQuery.data.allowArticleCreation,
        enableAIFeatures: settingsQuery.data.enableAIFeatures ?? false,
      });
    }
  }, [settingsQuery.data]);

  // Handle switch changes
  const handleSwitchChange = (
    field: keyof SettingsFormValues,
    checked: boolean,
  ) => {
    setSettings((prev) => ({ ...prev, [field]: checked }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // setSuccess(false);

    try {
      // Validate settings
      settingsSchema.parse(settings);

      // Save settings via API
      await handleTRPCMutation(
        () =>
          updateSettings.mutateAsync({
            allowRegistration: settings.allowRegistration,
            allowArticleCreation: settings.allowArticleCreation,
            enableAIFeatures: settings.enableAIFeatures,
          }),
        "Settings updated successfully",
        "Failed to update settings",
      );
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Format validation errors
        const errorMessages = err.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`,
        );
        setError(errorMessages.join(", "));
      } else {
        setError("An unexpected error occurred");
        console.error(err);
      }
    }
  };

  // Loading switch skeleton component
  const SettingSkeleton = () => (
    <div className="flex items-center justify-between py-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-6 w-11 rounded-full" />
    </div>
  );

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Settings2 className="text-primary h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure global settings that affect how users interact with the
          wiki.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in-50 mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* {success && (
        <Alert className="animate-in fade-in-50 mb-6 border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Settings saved successfully</AlertDescription>
        </Alert>
      )} */}

      <form onSubmit={handleSubmit}>
        <Card className="gap-0 py-0">
          <CardHeader className="bg-muted/60 py-6">
            <CardTitle className="text-xl">User Access</CardTitle>
            <CardDescription>
              Control who can register accounts and create content
            </CardDescription>
          </CardHeader>
          <CardContent className="py-0">
            {settingsQuery.isLoading ? (
              <>
                <SettingSkeleton />
                <Separator />
                <SettingSkeleton />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowRegistration" className="text-base">
                      Allow public registration
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      When enabled, visitors can create new accounts on the site
                    </p>
                  </div>
                  <Switch
                    id="allowRegistration"
                    checked={settings.allowRegistration}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("allowRegistration", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowArticleCreation" className="text-base">
                      Allow article creation
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      When enabled, registered users can create new wiki
                      articles
                    </p>
                  </div>
                  <Switch
                    id="allowArticleCreation"
                    checked={settings.allowArticleCreation}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("allowArticleCreation", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableAIFeatures" className="text-base">
                      Enable AI features
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      When enabled, AI-powered content suggestions and automated
                      assistance will be available throughout the wiki
                    </p>
                  </div>
                  <Switch
                    id="enableAIFeatures"
                    checked={settings.enableAIFeatures}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("enableAIFeatures", checked)
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="bg-muted/10 flex justify-end pt-6 pb-6">
            <Button
              type="submit"
              className="px-6"
              disabled={updateSettings.isPending || settingsQuery.isLoading}
            >
              {updateSettings.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-r-transparent"></span>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

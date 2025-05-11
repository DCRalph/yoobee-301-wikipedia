"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Check, AlertCircle } from "lucide-react";

// Settings schema
const settingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteDescription: z.string().min(1, "Site description is required"),
  featuredArticleId: z.string().optional(),
  allowPublicRegistration: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  footerText: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// Mock initial settings - in a real app, these would come from the database
const initialSettings: SettingsFormValues = {
  siteName: "WikiClone",
  siteDescription: "A modern Wikipedia clone with advanced features",
  featuredArticleId: "",
  allowPublicRegistration: true,
  requireApproval: false,
  footerText: "© 2023 WikiClone. All rights reserved.",
};

export function SettingsForm() {
  const [settings, setSettings] = useState<SettingsFormValues>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field: keyof SettingsFormValues) => {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle select changes
  const handleSelectChange = (
    field: keyof SettingsFormValues,
    value: string,
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      // Validate settings
      settingsSchema.parse(settings);

      // In a real app, you would save the settings to the database here
      // await api.settings.update(settings);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold tracking-tight">Site Settings</h2>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Settings saved successfully</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic information about your wiki</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  name="siteDescription"
                  value={settings.siteDescription}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  name="footerText"
                  value={settings.footerText ?? ""}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Settings</CardTitle>
              <CardDescription>
                Configure how content is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featuredArticle">Featured Article</Label>
                <Select
                  value={settings.featuredArticleId ?? "null"}
                  onValueChange={(value) =>
                    handleSelectChange("featuredArticleId", value)
                  }
                >
                  <SelectTrigger id="featuredArticle">
                    <SelectValue placeholder="Select featured article" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    <SelectItem value="article-1">
                      Introduction to WikiClone
                    </SelectItem>
                    <SelectItem value="article-2">
                      Getting Started Guide
                    </SelectItem>
                    <SelectItem value="article-3">
                      Community Guidelines
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Settings</CardTitle>
              <CardDescription>
                Configure user registration and access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowPublicRegistration"
                  checked={settings.allowPublicRegistration}
                  onCheckedChange={() =>
                    handleCheckboxChange("allowPublicRegistration")
                  }
                />
                <Label htmlFor="allowPublicRegistration">
                  Allow public registration
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireApproval"
                  checked={settings.requireApproval}
                  onCheckedChange={() => handleCheckboxChange("requireApproval")}
                />
                <Label htmlFor="requireApproval">
                  Require admin approval for new accounts
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

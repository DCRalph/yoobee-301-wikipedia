"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type Article } from "@prisma/client";
import { z } from "zod";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { formatDateTime } from "~/lib/date-utils";
import { AlertCircle, Save, Eye } from "lucide-react";

// Form validation schema
const articleSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be URL-friendly (lowercase, no spaces)",
    ),
  content: z.string().min(1, "Content is required"),
  summary: z.string().optional(),
  published: z.boolean().default(false),
});

type ArticleWithAuthorAndRevisions = Article & {
  author: { name: string | null; image: string | null };
  revisions: Array<{
    id: string;
    content: string;
    summary: string | null;
    createdAt: Date;
    editor: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }>;
};

interface ArticleFormProps {
  article?: ArticleWithAuthorAndRevisions;
}

export function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isEditing = !!article;

  // Form state
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [summary, setSummary] = useState("");
  const [published, setPublished] = useState(article?.published ?? false);
  const [activeTab, setActiveTab] = useState<string>("editor");

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing) {
      // Only auto-generate slug if this is a new article or the slug hasn't been manually edited
      setSlug(
        value
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, "-"),
      );
    }
  };

  // Create mutation
  const createMutation = api.articles.create.useMutation({
    onSuccess: () => {
      setSuccess("Article created successfully");
      setTimeout(() => {
        router.push("/admin/articles");
      }, 2000);
    },
    onError: (error) => {
      setError(`Failed to create article: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = api.articles.update.useMutation({
    onSuccess: () => {
      setSuccess("Article updated successfully");
      router.refresh();
    },
    onError: (error) => {
      setError(`Failed to update article: ${error.message}`);
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validate the form data
      const formData = {
        title,
        slug,
        content,
        summary,
        published,
      };

      const validatedData = articleSchema.parse(formData);

      startTransition(async () => {
        if (isEditing && article) {
          // Update existing article
          await updateMutation.mutateAsync({
            id: article.id,
            ...validatedData,
          });
        } else {
          // Create new article
          await createMutation.mutateAsync(validatedData);
        }
      });
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

  // Preview the article
  const handlePreview = () => {
    setActiveTab("preview");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-slug"
                required
              />
              <p className="text-muted-foreground text-xs">
                This will be the URL path: /wiki/{slug ?? "article-slug"}
              </p>
            </div>
          </div>

          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Article Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Created by:</span>
                  <span className="ml-2 text-sm">
                    {article.author.name ?? "Anonymous"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Created at:</span>
                  <span className="ml-2 text-sm">
                    {formatDateTime(new Date(article.createdAt))}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Last updated:</span>
                  <span className="ml-2 text-sm">
                    {formatDateTime(new Date(article.updatedAt))}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <span className="ml-2 text-sm">
                    {article.published ? "Published" : "Draft"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Content</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreview}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="space-y-4">
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Article content in Markdown format"
                className="min-h-[300px] font-mono"
                required
              />
              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="summary">Edit Summary</Label>
                  <Input
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Briefly describe your changes"
                  />
                </div>
              )}
            </TabsContent>
            <TabsContent value="preview">
              <div className="prose min-h-[300px] max-w-none rounded-md border p-4">
                {content ? (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  <p className="text-muted-foreground">
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {isEditing && article.revisions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revision History</CardTitle>
              <CardDescription>
                Previous edits made to this article
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {article.revisions.slice(0, 5).map((revision) => (
                  <div
                    key={revision.id}
                    className="border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        {revision.editor.name ?? "Anonymous"}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {formatDateTime(new Date(revision.createdAt))}
                      </div>
                    </div>
                    <div className="mt-1 text-sm">
                      {revision.summary ?? "No summary provided"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={published}
              onCheckedChange={(checked: boolean) => setPublished(checked)}
            />
            <Label htmlFor="published">Published</Label>
          </div>

          <div className="ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/articles")}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

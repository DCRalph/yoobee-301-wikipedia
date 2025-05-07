"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
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
import { AlertCircle, ArrowLeft, FileText, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

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
});

export function PublicArticleForm() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<string>("editor");

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, "-"),
    );
  };

  // Create mutation
  const createMutation = api.articles.create.useMutation({
    onSuccess: () => {
      setSuccess("Article created successfully");
      setTimeout(() => {
        router.push("/wiki");
      }, 2000);
    },
    onError: (error) => {
      setError(`Failed to create article: ${error.message}`);
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!session?.user) {
      setError("You must be logged in to create an article");
      return;
    }

    try {
      // Validate the form data
      const formData = {
        title,
        slug,
        content,
        published: true, // Public articles are published by default
      };

      const validatedData = articleSchema.parse(formData);

      startTransition(async () => {
        await createMutation.mutateAsync(validatedData);
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


  if (!session?.user) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href="/wiki">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wiki
              </Link>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">Create Article</h2>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to create a new article</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in before you can contribute to the wiki.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/api/auth/signin")}>
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href="/wiki">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Wiki
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Create New Article</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Article Details
              </CardTitle>
              <CardDescription>
                Basic information about your new article
              </CardDescription>
            </CardHeader>
            <CardContent>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
              <CardDescription>
                Write your article using Markdown syntax
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <div className="text-muted-foreground text-sm">
                    <p>You can use Markdown to format your content:</p>
                    <ul className="list-inside list-disc">
                      <li># for headings</li>
                      <li>
                        **bold** for <strong>bold text</strong>
                      </li>
                      <li>
                        *italic* for <em>italic text</em>
                      </li>
                      <li>- for bullet points</li>
                      <li>1. for numbered lists</li>
                      <li>[link text](url) for links</li>
                      <li>![alt text](image-url) for images</li>
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="preview">
                  <div
                    className={`prose dark:prose-invert min-h-[300px] max-w-none rounded-md border p-4 ${theme === "pink" ? "pink" : ""
                      }`}
                  >
                    {content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground">
                        Nothing to preview yet.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {isPending ? "Creating..." : "Create Article"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}

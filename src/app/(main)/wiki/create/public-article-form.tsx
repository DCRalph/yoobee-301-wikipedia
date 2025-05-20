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
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Plus,
  MessageSquare,
  BookOpen,
  ListFilter,
  Trash2,
} from "lucide-react";
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
  quickFacts: z.any().optional(),
  sources: z.string().optional(),
  talkContent: z.string().optional(),
});

export function PublicArticleForm() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get site settings
  const { data: siteSettings } = api.admin.settings.getPublic.useQuery();

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");

  // Separate tab state for each section
  const [activeSectionTab, setActiveSectionTab] = useState<string>("content");
  const [contentTab, setContentTab] = useState<string>("editor");
  const [sourcesTab, setSourcesTab] = useState<string>("editor");
  const [talkTab, setTalkTab] = useState<string>("editor");

  // New form state for additional fields
  const [quickFacts, setQuickFacts] = useState<Record<string, string>>({});
  const [sources, setSources] = useState("");
  const [talkContent, setTalkContent] = useState("");

  // State for quick facts editing
  const [newFactKey, setNewFactKey] = useState("");
  const [newFactValue, setNewFactValue] = useState("");

  // Add these new state variables after the other useState declarations
  const [editingFactKey, setEditingFactKey] = useState<string | null>(null);
  const [editedFactKey, setEditedFactKey] = useState("");
  const [editedFactValue, setEditedFactValue] = useState("");

  // Add these functions before addQuickFact function
  const startEditingFact = (key: string, value: string) => {
    setEditingFactKey(key);
    setEditedFactKey(key);
    setEditedFactValue(value);
  };

  const saveEditedFact = () => {
    if (editingFactKey && editedFactKey.trim() && editedFactValue.trim()) {
      const updatedFacts = { ...quickFacts };

      // If the key changed, remove the old one
      if (editingFactKey !== editedFactKey.trim()) {
        delete updatedFacts[editingFactKey];
      }

      // Add/update with the new key and value
      updatedFacts[editedFactKey.trim()] = editedFactValue.trim();
      setQuickFacts(updatedFacts);

      // Reset editing state
      setEditingFactKey(null);
      setEditedFactKey("");
      setEditedFactValue("");
    }
  };

  const cancelEdit = () => {
    setEditingFactKey(null);
    setEditedFactKey("");
    setEditedFactValue("");
  };

  // Add a quick fact key-value pair
  const addQuickFact = () => {
    if (newFactKey.trim() !== "" && newFactValue.trim() !== "") {
      setQuickFacts((prev) => ({
        ...prev,
        [newFactKey.trim()]: newFactValue.trim(),
      }));
      setNewFactKey("");
      setNewFactValue("");
    }
  };

  // Remove a quick fact
  const removeQuickFact = (key: string) => {
    const updatedFacts = { ...quickFacts };
    delete updatedFacts[key];
    setQuickFacts(updatedFacts);
  };

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
  const createMutation = api.user.articles.create.useMutation({
    onSuccess: () => {
      setSuccess("Article submitted for review successfully");
      setTimeout(() => {
        router.push("/wiki/pending");
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

    if (!siteSettings?.allowArticleCreation) {
      setError("Article creation is currently disabled");
      return;
    }

    try {
      // Validate the form data
      const formData = {
        title,
        slug,
        content,
        published: false, // Articles need approval before being published
        needsApproval: true,
        quickFacts,
        sources,
        talkContent,
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

  // If article creation is disabled, show a message
  if (siteSettings && !siteSettings.allowArticleCreation) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/wiki">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wiki
              </Link>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">
              Submit Article
            </h2>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Article Creation Disabled</CardTitle>
            <CardDescription>
              Article creation is currently disabled by administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              The administrators have temporarily disabled article creation.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/wiki">Return to Wiki</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/wiki">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wiki
              </Link>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">
              Submit Article
            </h2>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to create a new article
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              You need to be logged in before you can contribute to the wiki.
            </p>
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
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/wiki">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Wiki
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            Submit Article for Review
          </h2>
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
              <AlertDescription className="flex flex-col gap-2">
                <p>{success}</p>
                <p className="text-sm">
                  You will be redirected to your pending contributions in a
                  moment. Or you can{" "}
                  <Link href="/wiki/pending" className="font-medium underline">
                    view your pending articles now
                  </Link>
                  .
                </p>
              </AlertDescription>
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
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Article Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={activeSectionTab}
                onValueChange={setActiveSectionTab}
              >
                <TabsList>
                  <TabsTrigger value="content">
                    <FileText className="mr-2 h-4 w-4" />
                    Main Content
                  </TabsTrigger>
                  <TabsTrigger value="quickfacts">
                    <ListFilter className="mr-2 h-4 w-4" />
                    Quick Facts
                  </TabsTrigger>
                  <TabsTrigger value="sources">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Sources
                  </TabsTrigger>
                  <TabsTrigger value="talk">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Talk
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Article Content</h3>
                    <p className="text-muted-foreground text-sm">
                      Write your article using Markdown syntax
                    </p>
                  </div>
                  <Tabs value={contentTab} onValueChange={setContentTab}>
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
                        className="min-h-[400px] font-mono"
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
                        className={`prose dark:prose-invert min-h-[400px] max-w-none rounded-md border p-4 ${
                          theme === "pink" ? "pink" : ""
                        }`}
                      >
                        {content ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-muted-foreground italic">
                            Nothing to preview yet.
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="quickfacts" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Quick Facts</h3>
                    <p className="text-muted-foreground text-sm">
                      Key-value pairs for the quick facts section
                    </p>
                  </div>
                  <div className="space-y-6">
                    {/* Existing facts */}
                    {Object.keys(quickFacts).length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="text-muted-foreground text-sm font-medium">
                          Current Facts
                        </h3>
                        <div className="rounded-md border">
                          {Object.entries(quickFacts).map(([key, value]) => (
                            <div
                              key={key}
                              className="hover:bg-muted/50 border-b p-3 last:border-b-0"
                            >
                              {editingFactKey === key ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label htmlFor={`edit-key-${key}`}>
                                        Key
                                      </Label>
                                      <Input
                                        id={`edit-key-${key}`}
                                        value={editedFactKey}
                                        onChange={(e) =>
                                          setEditedFactKey(e.target.value)
                                        }
                                        placeholder="Fact name"
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`edit-value-${key}`}>
                                        Value
                                      </Label>
                                      <Input
                                        id={`edit-value-${key}`}
                                        value={editedFactValue}
                                        onChange={(e) =>
                                          setEditedFactValue(e.target.value)
                                        }
                                        placeholder="Fact value"
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={saveEditedFact}
                                      disabled={
                                        !editedFactKey.trim() ||
                                        !editedFactValue.trim()
                                      }
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={cancelEdit}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-medium">
                                      {key}:
                                    </span>{" "}
                                    <span className="text-sm">{value}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        startEditingFact(key, String(value))
                                      }
                                      className="h-8 w-8 p-0"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-blue-500"
                                      >
                                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        <path d="m15 5 4 4" />
                                      </svg>
                                      <span className="sr-only">Edit</span>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeQuickFact(key)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center">
                        <p className="mb-2 text-sm">
                          No quick facts added yet.
                        </p>
                        <p className="text-xs">
                          Add facts below to display in the info box on the
                          article page.
                        </p>
                      </div>
                    )}

                    {/* Add new fact */}
                    <div className="space-y-3">
                      <h3 className="text-muted-foreground text-sm font-medium">
                        Add New Fact
                      </h3>
                      <div className="rounded-md border p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="factKey" className="text-sm">
                              Key
                            </Label>
                            <Input
                              id="factKey"
                              value={newFactKey}
                              onChange={(e) => setNewFactKey(e.target.value)}
                              placeholder="e.g., Population"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="factValue" className="text-sm">
                              Value
                            </Label>
                            <Input
                              id="factValue"
                              value={newFactValue}
                              onChange={(e) => setNewFactValue(e.target.value)}
                              placeholder="e.g., 5.1 million"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={addQuickFact}
                          disabled={!newFactKey.trim() || !newFactValue.trim()}
                          className="mt-3"
                        >
                          Add Fact
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sources" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Sources</h3>
                    <p className="text-muted-foreground text-sm">
                      References and sources for this article
                    </p>
                  </div>
                  <Tabs value={sourcesTab} onValueChange={setSourcesTab}>
                    <TabsList>
                      <TabsTrigger value="editor">Editor</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="editor" className="space-y-4">
                      <Textarea
                        id="sources"
                        value={sources}
                        onChange={(e) => setSources(e.target.value)}
                        placeholder="List your sources using Markdown..."
                        className="min-h-[300px] font-mono"
                      />
                    </TabsContent>
                    <TabsContent value="preview">
                      <div
                        className={`prose dark:prose-invert min-h-[300px] max-w-none rounded-md border p-4 ${
                          theme === "pink" ? "pink" : ""
                        }`}
                      >
                        {sources ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {sources}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-muted-foreground italic">
                            No sources added yet...
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="talk" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Talk / Discussion</h3>
                    <p className="text-muted-foreground text-sm">
                      Discussion about this article
                    </p>
                  </div>
                  <Tabs value={talkTab} onValueChange={setTalkTab}>
                    <TabsList>
                      <TabsTrigger value="editor">Editor</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="editor" className="space-y-4">
                      <Textarea
                        id="talkContent"
                        value={talkContent}
                        onChange={(e) => setTalkContent(e.target.value)}
                        placeholder="Start a discussion about this article..."
                        className="min-h-[300px] font-mono"
                      />
                    </TabsContent>
                    <TabsContent value="preview">
                      <div
                        className={`prose dark:prose-invert min-h-[300px] max-w-none rounded-md border p-4 ${
                          theme === "pink" ? "pink" : ""
                        }`}
                      >
                        {talkContent ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {talkContent}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-muted-foreground italic">
                            No discussion content yet...
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {isPending ? "Submitting..." : "Submit for Review"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}

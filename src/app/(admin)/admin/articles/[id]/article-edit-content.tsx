"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
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
  Save,
  Trash2,
  History,
  CheckCircle2,
  XCircle,
  ClockIcon,
  Eye,
  MessageSquare,
  BookOpen,
  ListFilter,
  Star,
  StarOff,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { formatDate } from "~/lib/date-utils";
import { handleTRPCMutation } from "~/lib/toast";
import { type RouterOutputs } from "~/trpc/react";

// Form validation schema
const articleSchema = z.object({
  id: z.string(),
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
  published: z.boolean(),
  approved: z.boolean(),
  needsApproval: z.boolean(),
  quickFacts: z.any().optional(),
  sources: z.string().optional(),
  talkContent: z.string().optional(),
  imageUrl: z.string().optional(),
});

const featuredSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

type FeaturedFormData = z.infer<typeof featuredSchema>;

interface ArticleEditContentProps {
  article: RouterOutputs["admin"]["articles"]["getById"];
}

export function ArticleEditContent({ article }: ArticleEditContentProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [content, setContent] = useState(article.content);
  const [published, setPublished] = useState(article.published);
  const [approved, setApproved] = useState(article.approved);
  const [needsApproval, setNeedsApproval] = useState(article.needsApproval);
  const [imageUrl, setImageUrl] = useState(article.imageUrl ?? "");

  // New form state for additional fields
  const [quickFacts, setQuickFacts] = useState<Record<string, string>>(
    (article.quickFacts as Record<string, string>) ?? {},
  );
  const [sources, setSources] = useState(article.sources ?? "");
  const [talkContent, setTalkContent] = useState(article.talkContent ?? "");

  // Featured article state
  const [showFeaturedForm, setShowFeaturedForm] = useState(false);
  const [featuredFormData, setFeaturedFormData] = useState<FeaturedFormData>({
    description: article.featuredDescription ?? "",
  });
  const [featuredErrors, setFeaturedErrors] = useState<
    Partial<Record<keyof FeaturedFormData, string>>
  >({});

  // Separate tab state for each section
  const [activeSideTab, setActiveSideTab] = useState<string>("content");
  const [contentTab, setContentTab] = useState<string>("editor");
  const [sourcesTab, setSourcesTab] = useState<string>("editor");
  const [talkTab, setTalkTab] = useState<string>("editor");

  // State for quick facts editing
  const [newFactKey, setNewFactKey] = useState("");
  const [newFactValue, setNewFactValue] = useState("");

  // After the useState declarations
  const [editingFactKey, setEditingFactKey] = useState<string | null>(null);
  const [editedFactKey, setEditedFactKey] = useState("");
  const [editedFactValue, setEditedFactValue] = useState("");

  // Add this function before the addQuickFact function
  const startEditingFact = (key: string, value: string) => {
    setEditingFactKey(key);
    setEditedFactKey(key);
    setEditedFactValue(value);
  };

  // Add a save edit function before the addQuickFact function
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

  // Add a cancel edit function before the addQuickFact function
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
    // Only auto-generate slug if user hasn't manually edited it
    if (slug === article.slug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, "-"),
      );
    }
  };

  // Update mutation
  const updateMutation = api.admin.articles.update.useMutation({
    onSuccess: () => {
      setSuccess("Article updated successfully");
      // Refresh the page data
      router.refresh();
    },
    onError: (error) => {
      setError(`Failed to update article: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = api.admin.articles.delete.useMutation({
    onSuccess: () => {
      setSuccess("Article deleted successfully");
      // Redirect to articles list
      setTimeout(() => {
        router.push("/admin/articles");
      }, 1500);
    },
    onError: (error) => {
      setError(`Failed to delete article: ${error.message}`);
      setDeleteDialogOpen(false);
    },
  });

  // Featured mutation
  const setFeaturedMutation = api.article.setFeatured.useMutation({
    onSuccess: () => {
      setSuccess("Featured status updated successfully");
      setShowFeaturedForm(false);
      setFeaturedFormData({ description: "" });
      setFeaturedErrors({});
      // Refresh the page data
      router.refresh();
    },
    onError: (error) => {
      setError(`Failed to update featured status: ${error.message}`);
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
        id: article.id,
        title,
        slug,
        content,
        published,
        approved,
        needsApproval,
        quickFacts,
        sources,
        talkContent,
        imageUrl,
      };

      const validatedData = articleSchema.parse(formData);

      await handleTRPCMutation(
        () => updateMutation.mutateAsync(validatedData),
        "Article updated successfully",
        "Failed to update article",
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

  // Handle delete action
  const handleDelete = () => {
    deleteMutation.mutate({ id: article.id });
  };

  // Set approval status to "Needs Approval"
  const setStatusNeedsApproval = () => {
    setApproved(false);
    setNeedsApproval(true);
  };

  // Set approval status to "Rejected"
  const setStatusRejected = () => {
    setApproved(false);
    setNeedsApproval(false);
  };

  // Set approval status to "Approved"
  const setStatusApproved = () => {
    setApproved(true);
    setNeedsApproval(false);
  };

  // Handle featured form input changes
  const handleFeaturedInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFeaturedFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (featuredErrors[name as keyof FeaturedFormData]) {
      setFeaturedErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle featured form submission
  const handleFeaturedSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const validatedData = featuredSchema.parse(featuredFormData);
      setFeaturedMutation.mutate({
        id: article.id,
        featured: true,
        description: validatedData.description,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setFeaturedErrors(formattedErrors);
      }
    }
  };

  // Handle unfeature action
  const handleUnfeature = () => {
    setFeaturedMutation.mutate({
      id: article.id,
      featured: false,
    });
  };

  // Handle feature button click
  const handleFeatureClick = () => {
    setShowFeaturedForm(true);
    setFeaturedFormData({ description: article.featuredDescription ?? "" });
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/articles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Articles
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Edit Article</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={updateMutation.isPending}
            onClick={handleSubmit}
          >
            {updateMutation.isPending ? (
              <>
                <ClockIcon className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/wiki/${article.slug}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              View Article
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Featured Article Form */}
      {showFeaturedForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#6b4c35]" />
              Set Featured Description
            </CardTitle>
            <CardDescription>
              Add a description explaining why this article is being featured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="featuredForm" onSubmit={handleFeaturedSubmit}>
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  Featured Description
                </Label>
                <Textarea
                  name="description"
                  value={featuredFormData.description}
                  onChange={handleFeaturedInputChange}
                  className="w-full rounded-md border p-2 focus:border-[#6b4c35] focus:ring-[#6b4c35]"
                  placeholder="Enter a description for why this article is featured..."
                  rows={3}
                />
                {featuredErrors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {featuredErrors.description}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="submit"
                form="featuredForm"
                disabled={setFeaturedMutation.isPending}
                className="bg-[#6b4c35] text-white hover:bg-[#8b6c55]"
              >
                {setFeaturedMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Set as Featured
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeaturedForm(false);
                  setFeaturedFormData({ description: "" });
                  setFeaturedErrors({});
                }}
              >
                Cancel
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Article Details
                  </CardTitle>
                  <CardDescription>
                    Basic information about the article
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                        This will be the URL path: /wiki/{slug}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Featured Image URL</Label>
                      <Input
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-muted-foreground text-xs">
                        {"URL for the article's featured image (optional)"}
                      </p>
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
                  <Tabs value={activeSideTab} onValueChange={setActiveSideTab}>
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
                          Edit content using Markdown syntax
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
                            placeholder="Write your article content here..."
                            className="min-h-[400px] font-mono"
                            required
                          />
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
                                Nothing to preview...
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
                              {Object.entries(quickFacts).map(
                                ([key, value]) => (
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
                                            <Label
                                              htmlFor={`edit-value-${key}`}
                                            >
                                              Value
                                            </Label>
                                            <Input
                                              id={`edit-value-${key}`}
                                              value={editedFactValue}
                                              onChange={(e) =>
                                                setEditedFactValue(
                                                  e.target.value,
                                                )
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
                                          <span className="text-sm">
                                            {value}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              startEditingFact(
                                                key,
                                                String(value),
                                              )
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
                                            <span className="sr-only">
                                              Edit
                                            </span>
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeQuickFact(key)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                            <span className="sr-only">
                                              Delete
                                            </span>
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ),
                              )}
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
                                  onChange={(e) =>
                                    setNewFactKey(e.target.value)
                                  }
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
                                  onChange={(e) =>
                                    setNewFactValue(e.target.value)
                                  }
                                  placeholder="e.g., 5.1 million"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={addQuickFact}
                              disabled={
                                !newFactKey.trim() || !newFactValue.trim()
                              }
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
                        <h3 className="text-lg font-medium">
                          Talk / Discussion
                        </h3>
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
                            placeholder="Discussion content using Markdown..."
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
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Article Status</CardTitle>
                  <CardDescription>
                    Control the publication status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="published">Published</Label>
                        <p className="text-muted-foreground text-xs">
                          Make this article visible to users
                        </p>
                      </div>
                      <Switch
                        id="published"
                        checked={published}
                        onCheckedChange={setPublished}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div>
                        <Label>Approval Status</Label>
                        <p className="text-muted-foreground mb-2 text-xs">
                          Current status:{" "}
                          {approved ? (
                            <span className="font-medium text-green-600">
                              Approved
                            </span>
                          ) : needsApproval ? (
                            <span className="font-medium text-blue-600">
                              Pending Approval
                            </span>
                          ) : (
                            <span className="font-medium text-red-600">
                              Rejected
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 items-start gap-2">
                        <Button
                          type="button"
                          variant={needsApproval ? "default" : "outline"}
                          size="sm"
                          onClick={setStatusNeedsApproval}
                          className={`col-span-2 dark:text-white ${
                            needsApproval ? "bg-blue-600 hover:bg-blue-700" : ""
                          }`}
                        >
                          <ClockIcon className="mr-2 h-4 w-4" />
                          Needs Approval
                        </Button>
                        <Button
                          type="button"
                          variant={
                            !approved && !needsApproval ? "default" : "outline"
                          }
                          size="sm"
                          onClick={setStatusRejected}
                          className={`dark:text-white ${
                            !approved && !needsApproval
                              ? "bg-red-600 hover:bg-red-700"
                              : ""
                          }`}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          type="button"
                          variant={approved ? "default" : "outline"}
                          size="sm"
                          onClick={setStatusApproved}
                          className={`dark:text-white ${
                            approved ? "bg-green-600 hover:bg-green-700" : ""
                          }`}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Featured Status
                  </CardTitle>
                  <CardDescription>
                    Control whether this article appears as featured
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Current Status</Label>
                        <div>
                          {article.isFeatured ? (
                            <span className="inline-flex items-center rounded-full bg-[#6b4c35]/10 px-2.5 py-0.5 text-xs font-medium text-[#6b4c35]">
                              <Star className="mr-1 h-3 w-3" />
                              Featured
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                              Not Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {article.isFeatured && article.featuredDescription && (
                      <div className="space-y-1">
                        <Label>Featured Description</Label>
                        <p className="text-muted-foreground rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
                          {article.featuredDescription}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {article.isFeatured ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUnfeature}
                          disabled={setFeaturedMutation.isPending}
                          className="border-red-200 text-red-500 hover:border-red-300 hover:text-red-700"
                        >
                          <StarOff className="mr-1 h-4 w-4" />
                          Remove Featured
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFeatureClick}
                          disabled={setFeaturedMutation.isPending}
                          className="border-[#6b4c35]/20 text-[#6b4c35] hover:border-[#6b4c35]/30 hover:text-[#8b6c55]"
                        >
                          <Star className="mr-1 h-4 w-4" />
                          Set as Featured
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Article Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Author:</span>{" "}
                      {article.author.name ?? "Anonymous"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>{" "}
                      {formatDate(new Date(article.createdAt))}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span>{" "}
                      {formatDate(new Date(article.updatedAt))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {article.revisions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Revision History
                    </CardTitle>
                    <CardDescription>
                      This article has {article.revisions.length} revisions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 space-y-2 overflow-y-auto text-sm">
                      {article.revisions.slice(0, 5).map((revision) => (
                        <div
                          key={revision.id}
                          className="flex items-center justify-between border-b py-1 last:border-0"
                        >
                          <div>
                            <span className="font-medium">
                              {revision.editor.name ?? "Anonymous"}
                            </span>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {formatDate(new Date(revision.createdAt))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  {article.revisions.length > 5 && (
                    <CardFooter>
                      <Button variant="link" size="sm" className="px-0" asChild>
                        <Link href={`/wiki/${slug}/history`}>
                          View all revisions
                        </Link>
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              onClick={handleSubmit}
            >
              {updateMutation.isPending ? (
                <>
                  <ClockIcon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this article? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

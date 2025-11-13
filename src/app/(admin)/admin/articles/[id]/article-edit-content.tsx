"use client";

import { useState, useEffect } from "react";
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
  Tag,
  Pencil,
  X,
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
import { Checkbox } from "~/components/ui/checkbox";
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

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

  // Category management
  const { data: articleCategories } = api.article.getCategories.useQuery({
    articleId: article.id,
  });
  const { data: allCategories } = api.category.getAll.useQuery();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Initialize selected categories from article categories
  useEffect(() => {
    if (articleCategories) {
      setSelectedCategoryIds(articleCategories.map((ac) => ac.categoryId));
    }
  }, [articleCategories]);

  const updateCategoriesMutation = api.article.updateCategories.useMutation({
    onSuccess: () => {
      setSuccess("Categories updated successfully");
      // Refresh the page data
      router.refresh();
    },
    onError: (error) => {
      setError(`Failed to update categories: ${error.message}`);
    },
  });

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSaveCategories = () => {
    updateCategoriesMutation.mutate({
      articleId: article.id,
      categoryIds: selectedCategoryIds,
    });
  };

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
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/articles">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Articles</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Edit Article
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={updateMutation.isPending}
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              <span className="hidden sm:inline">View</span>
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{success}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-green-800 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/40"
              onClick={() => setSuccess(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive/20"
              onClick={() => setError(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
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
              <div className="space-y-2">
                <Label htmlFor="featured-description" className="text-sm font-medium">
                  Featured Description
                </Label>
                <Textarea
                  id="featured-description"
                  name="description"
                  value={featuredFormData.description}
                  onChange={handleFeaturedInputChange}
                  placeholder="Enter a description for why this article is featured..."
                  rows={4}
                  className="resize-none"
                />
                {featuredErrors.description && (
                  <p className="text-sm text-destructive">
                    {featuredErrors.description}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
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
            <Button
              type="submit"
              form="featuredForm"
              disabled={setFeaturedMutation.isPending}
              className="bg-[#6b4c35] text-white hover:bg-[#8b6c55]"
            >
              {setFeaturedMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Set as Featured"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
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
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Article title"
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-sm font-medium">
                      Slug
                    </Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="article-slug"
                      required
                      className="w-full font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL path: <code className="rounded bg-muted px-1 py-0.5">/wiki/{slug || "article-slug"}</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl" className="text-sm font-medium">
                      Featured Image URL
                    </Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      type="url"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: URL for the article&apos;s featured image
                    </p>
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
                            placeholder="Write your article content here using Markdown..."
                            className="min-h-[400px] w-full font-mono text-sm"
                            required
                          />
                        </TabsContent>
                        <TabsContent value="preview">
                          <div
                            className={`prose dark:prose-invert min-h-[400px] max-w-none rounded-md border bg-muted/30 p-4 ${theme === "pink" ? "pink" : ""
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
                                            className="h-8 w-8 p-0 hover:bg-muted"
                                            title="Edit fact"
                                          >
                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                            <span className="sr-only">Edit</span>
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeQuickFact(key)}
                                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                            title="Delete fact"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
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
                          <div className="rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 p-8 text-center">
                            <ListFilter className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                            <p className="mb-1 text-sm font-medium text-muted-foreground">
                              No quick facts added yet
                            </p>
                            <p className="text-xs text-muted-foreground/80">
                              Add facts below to display in the info box on the article page
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
                            className="min-h-[300px] w-full font-mono text-sm"
                          />
                        </TabsContent>
                        <TabsContent value="preview">
                          <div
                            className={`prose dark:prose-invert min-h-[300px] max-w-none rounded-md border bg-muted/30 p-4 ${theme === "pink" ? "pink" : ""
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
                            className="min-h-[300px] w-full font-mono text-sm"
                          />
                        </TabsContent>
                        <TabsContent value="preview">
                          <div
                            className={`prose dark:prose-invert min-h-[300px] max-w-none rounded-md border bg-muted/30 p-4 ${theme === "pink" ? "pink" : ""
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
                    Control the publication and approval status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="published" className="text-sm font-medium">
                        Published
                      </Label>
                      <p className="text-xs text-muted-foreground">
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

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Approval Status</Label>
                      <div className="mt-1.5">
                        {approved ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Approved
                          </span>
                        ) : needsApproval ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            <ClockIcon className="mr-1 h-3 w-3" />
                            Pending Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            <XCircle className="mr-1 h-3 w-3" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        type="button"
                        variant={needsApproval ? "default" : "outline"}
                        size="sm"
                        onClick={setStatusNeedsApproval}
                        className={`w-full justify-start ${needsApproval
                          ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                          : ""
                          }`}
                      >
                        <ClockIcon className="mr-2 h-4 w-4" />
                        Needs Approval
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={
                            !approved && !needsApproval ? "default" : "outline"
                          }
                          size="sm"
                          onClick={setStatusRejected}
                          className={`justify-start ${!approved && !needsApproval
                            ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
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
                          className={`justify-start ${approved
                            ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                            : ""
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
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Categories
                  </CardTitle>
                  <CardDescription>
                    Assign this article to categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allCategories === undefined ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : allCategories && allCategories.length > 0 ? (
                    <>
                      <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
                        {allCategories.map((category) => (
                          <label
                            key={category.id}
                            htmlFor={`category-${category.id}`}
                            className="flex cursor-pointer items-center space-x-2 rounded-md p-2 transition-colors hover:bg-muted/50"
                          >
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={selectedCategoryIds.includes(category.id)}
                              onCheckedChange={() =>
                                handleCategoryToggle(category.id)
                              }
                            />
                            <span className="flex-1 text-sm font-medium">
                              {category.name}
                            </span>
                          </label>
                        ))}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveCategories}
                        disabled={
                          updateCategoriesMutation.isPending ||
                          !articleCategories ||
                          JSON.stringify([...selectedCategoryIds].sort()) ===
                          JSON.stringify(
                            [...articleCategories.map((ac) => ac.categoryId)].sort()
                          )
                        }
                        className="w-full"
                      >
                        {updateCategoriesMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Categories
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 p-6 text-center">
                      <Tag className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        No categories available
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/80">
                        Create categories in the categories page
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Article Metadata</CardTitle>
                  <CardDescription>
                    Information about this article
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-sm font-medium text-muted-foreground">
                      Author
                    </span>
                    <span className="text-sm">{article.author.name ?? "Anonymous"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-sm font-medium text-muted-foreground">
                      Created
                    </span>
                    <span className="text-sm">
                      {formatDate(new Date(article.createdAt))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Updated
                    </span>
                    <span className="text-sm">
                      {formatDate(new Date(article.updatedAt))}
                    </span>
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
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {article.revisions.slice(0, 5).map((revision) => (
                        <div
                          key={revision.id}
                          className="flex items-center justify-between border-b border-dashed pb-2 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {revision.editor.name ?? "Anonymous"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date(revision.createdAt))}
                          </span>
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

          <div className="flex justify-end border-t pt-6">
            <Button
              type="submit"
              size="lg"
              disabled={updateMutation.isPending}
              onClick={handleSubmit}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

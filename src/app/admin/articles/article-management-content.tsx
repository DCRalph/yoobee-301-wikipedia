"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import {
  Search,
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "~/lib/date-utils";

export function ArticleManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  // Determine if we should filter by published status
  const filterPublished =
    status === "published" ? true : status === "draft" ? false : undefined;

  // Query articles with tRPC
  const { data, isLoading, refetch } = api.articles.getAll.useQuery(
    {
      limit: 100,
      filterPublished,
    },
    { enabled: mounted },
  );

  // Delete mutation
  const deleteMutation = api.articles.delete.useMutation({
    onSuccess: () => {
      void refetch();
      setDeleteDialogOpen(false);
    },
  });

  // Update mutation for publishing/unpublishing
  const updateMutation = api.articles.update.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter articles based on search term
  const filteredArticles = data?.articles.filter((article) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.slug.toLowerCase().includes(searchLower)
    );
  });

  // Handle delete confirmation
  const confirmDelete = (articleId: string) => {
    setArticleToDelete(articleId);
    setDeleteDialogOpen(true);
  };

  // Handle delete action
  const handleDelete = () => {
    if (articleToDelete) {
      deleteMutation.mutate({ id: articleToDelete });
    }
  };

  // Toggle published status
  const togglePublished = (articleId: string, currentStatus: boolean) => {
    updateMutation.mutate({
      id: articleId,
      published: !currentStatus,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight">Article Management</h2>
        </div>
        <Button onClick={() => router.push("/admin/articles/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Article
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant={status === "published" ? "default" : "outline"}
            size="sm"
            onClick={() => router.push("/admin/articles?status=published")}
          >
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Published
          </Button>
          <Button
            variant={status === "draft" ? "default" : "outline"}
            size="sm"
            onClick={() => router.push("/admin/articles?status=draft")}
          >
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            Drafts
          </Button>
          <Button
            variant={!status ? "default" : "outline"}
            size="sm"
            onClick={() => router.push("/admin/articles")}
          >
            All
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading articles...
                </TableCell>
              </TableRow>
            ) : filteredArticles && filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {article.slug}
                  </TableCell>
                  <TableCell>
                    {article.published ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Clock className="h-4 w-4" />
                        Draft
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{article.author.name ?? "Anonymous"}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(article.updatedAt))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/wiki/${article.slug}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/articles/${article.id}`)
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            togglePublished(article.id, article.published)
                          }
                        >
                          {article.published ? (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => confirmDelete(article.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No articles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

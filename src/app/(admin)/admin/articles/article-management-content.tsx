"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  PaginatedSearchList,
  type PaginatedSearchListRef,
  type SortOption,
} from "~/components/PaginatedSearchList";

export function ArticleManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const approval = searchParams.get("approval");
  const searchRef = useRef<PaginatedSearchListRef>(null);

  const [mounted, setMounted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSort, setCurrentSort] = useState<SortOption>({
    field: "updatedAt",
    direction: "desc",
    label: "Recently Updated",
  });

  // Available sort options
  const sortOptions: SortOption[] = [
    { field: "title", direction: "asc", label: "Title A-Z" },
    { field: "title", direction: "desc", label: "Title Z-A" },
    { field: "updatedAt", direction: "desc", label: "Recently Updated" },
    { field: "updatedAt", direction: "asc", label: "Oldest Updated" },
    { field: "createdAt", direction: "desc", label: "Recently Created" },
    { field: "createdAt", direction: "asc", label: "Oldest Created" },
  ];

  // Determine if we should filter by published status
  const filterPublished =
    status === "published" ? true : status === "draft" ? false : undefined;

  // Determine if we should filter by approval status
  const filterApproved =
    approval === "approved"
      ? true
      : approval === "pending"
        ? undefined
        : approval === "rejected"
          ? false
          : undefined;

  const filterNeedsApproval = approval === "pending" ? true : undefined;

  // Get articles API
  const articlesApi = api.admin.articles;

  // Query articles with tRPC - modified to support pagination
  const { data, isLoading, refetch } = articlesApi.getAll.useQuery(
    {
      page: currentPage,
      limit: 100,
      search: searchTerm,
      filterPublished,
      filterApproved,
      filterNeedsApproval,
      sortField: currentSort.field,
      sortDirection: currentSort.direction,
    },
    { enabled: mounted },
  );

  // Delete mutation
  const deleteMutation = articlesApi.delete.useMutation({
    onSuccess: () => {
      void refetch();
      setDeleteDialogOpen(false);
    },
  });

  // Update mutation for publishing/unpublishing
  const updateMutation = articlesApi.update.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Toggle approval status
  const toggleApproval = (
    articleId: string,
    currentStatus: boolean,
    needsApproval: boolean,
  ) => {
    updateMutation.mutate({
      id: articleId,
      approved: !currentStatus,
      needsApproval: currentStatus ? false : needsApproval,
    });
  };

  // Handle search
  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle sort change
  const handleSortChange = (sort: SortOption) => {
    setCurrentSort(sort);
  };

  // Add tag to search (for status/approval filters)
  const addSearchTag = (tag: string) => {
    searchRef.current?.addTag(tag);
  };

  // Calculate pagination data
  const pagination = {
    total: data?.total ?? 0,
    page: currentPage,
    limit: 100,
    totalPages: Math.ceil((data?.total ?? 0) / 100),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Article Management
          </h2>
        </div>
        <Button onClick={() => router.push("/wiki/create")}>
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
            onClick={() => {
              router.push("/admin/articles?status=published");
              if (status !== "published") {
                addSearchTag("published");
              }
            }}
          >
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Published
          </Button>
          <Button
            variant={status === "draft" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              router.push("/admin/articles?status=draft");
              if (status !== "draft") {
                addSearchTag("draft");
              }
            }}
          >
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            Drafts
          </Button>
          <Button
            variant={!status ? "default" : "outline"}
            size="sm"
            onClick={() => router.push("/admin/articles")}
          >
            All Status
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <div className="flex space-x-2">
          <Button
            variant={approval === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              router.push(
                status
                  ? `/admin/articles?status=${status}&approval=approved`
                  : "/admin/articles?approval=approved",
              );
              if (approval !== "approved") {
                addSearchTag("approved");
              }
            }}
          >
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Approved
          </Button>
          <Button
            variant={approval === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              router.push(
                status
                  ? `/admin/articles?status=${status}&approval=pending`
                  : "/admin/articles?approval=pending",
              );
              if (approval !== "pending") {
                addSearchTag("pending");
              }
            }}
          >
            <Clock className="mr-2 h-4 w-4 text-blue-500" />
            Pending Approval
          </Button>
          <Button
            variant={approval === "rejected" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              router.push(
                status
                  ? `/admin/articles?status=${status}&approval=rejected`
                  : "/admin/articles?approval=rejected",
              );
              if (approval !== "rejected") {
                addSearchTag("rejected");
              }
            }}
          >
            <X className="mr-2 h-4 w-4 text-red-500" />
            Rejected
          </Button>
          <Button
            variant={!approval ? "default" : "outline"}
            size="sm"
            onClick={() =>
              router.push(
                status ? `/admin/articles?status=${status}` : "/admin/articles",
              )
            }
          >
            All Approval
          </Button>
        </div>
      </div>

      <PaginatedSearchList
        ref={searchRef}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        pagination={pagination}
        searchPlaceholder="Search articles..."
        isLoading={isLoading}
        initialSearchValue={searchParams.get("q") ?? ""}
        sortOptions={sortOptions}
        initialSort={currentSort}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading articles...
                </TableCell>
              </TableRow>
            ) : data?.articles && data.articles.length > 0 ? (
              data.articles.map((article) => (
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
                  <TableCell>
                    {article.approved ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        Approved
                      </span>
                    ) : article.needsApproval ? (
                      <span className="flex items-center gap-1 text-blue-500">
                        <Clock className="h-4 w-4" />
                        Needs Approval
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500">
                        <X className="h-4 w-4" />
                        Rejected
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
                        <DropdownMenuItem
                          onClick={() =>
                            toggleApproval(
                              article.id,
                              article.approved,
                              article.needsApproval,
                            )
                          }
                        >
                          {article.approved ? (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Unapprove
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Approve
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
                <TableCell colSpan={7} className="text-center">
                  No articles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </PaginatedSearchList>

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

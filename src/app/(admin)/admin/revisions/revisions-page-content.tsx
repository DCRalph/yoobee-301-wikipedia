"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
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
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Revision } from "@prisma/client";

interface RevisionWithRelations extends Revision {
  article: {
    id: string;
    title: string;
    slug: string;
  };
  editor: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface RevisionsResponse {
  revisions: RevisionWithRelations[];
  nextCursor: string | undefined;
}

export function RevisionsPageContent() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);

  const { data, isLoading, error } = api.admin.revisions.getAllRevisions.useQuery({
    limit: 10,
    cursor,
    filter,
  }) as { data: RevisionsResponse | undefined; isLoading: boolean; error: Error | null };

  const router = useRouter();

  const handleNextPage = () => {
    if (data?.nextCursor) {
      setPrevCursors([...prevCursors, cursor ?? ""]);
      setCursor(data.nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (prevCursors.length > 0) {
      const prevCursor = prevCursors[prevCursors.length - 1];
      setPrevCursors(prevCursors.slice(0, -1));
      setCursor(prevCursor ?? undefined);
    }
  };

  const filterOptions = [
    { label: "All Revisions", value: "all" },
    { label: "Pending Approval", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  const getStatusBadge = (approved: boolean, needsApproval: boolean) => {
    if (needsApproval) {
      return <Badge variant="outline" className="bg-amber-200 dark:bg-amber-800">Pending</Badge>;
    }
    if (approved) {
      return <Badge variant="outline" className="bg-green-200 dark:bg-green-800">Approved</Badge>;
    }
    return <Badge variant="outline" className="bg-red-200 dark:bg-red-800">Rejected</Badge>;
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Article Revisions</CardTitle>
          <CardDescription>
            View and manage all revisions made to articles in the system
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(value as typeof filter);
                setCursor(undefined);
                setPrevCursors([]);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter revisions" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-red-500">Error loading revisions: {error.message}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Editor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.revisions && data.revisions.length > 0 ? (
                    data.revisions.map((revision) => (
                      <TableRow key={revision.id}>
                        <TableCell>
                          <Link
                            href={`/admin/articles/${revision.article.slug}`}
                            className="hover:underline"
                          >
                            {revision.article.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {revision.editor.name}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(revision.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(revision.approved, revision.needsApproval)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/revisions/${revision.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No revisions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={prevCursors.length === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!data?.nextCursor}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
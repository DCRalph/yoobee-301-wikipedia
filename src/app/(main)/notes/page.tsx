"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Trash2, Brain, RefreshCw, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { formatDate } from "~/lib/date-utils";
import { Badge } from "~/components/ui/badge";

// Define types for notes
type Note = RouterOutputs["user"]["notes"]["getNotes"]["notes"][number];

export default function NotesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (isClient && status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [isClient, status, router]);

  const {
    data: notesData,
    error,
    refetch,
  } = api.user.notes.getNotes.useQuery(
    {
      limit: 50,
    },
    {
      enabled: !!session,
      refetchOnWindowFocus: false,
    },
  );

  const deleteNote = api.user.notes.deleteNote.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("Note deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete note: ${error.message}`);
    },
  });

  const handleDeleteNote = (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate({ id });
    }
  };

  const renderSummaryLevel = (type: string) => {
    const levelMap = {
      AI_SUMMARY_NOVICE: { label: "Novice", color: "bg-green-500" },
      AI_SUMMARY_INTERMEDIATE: { label: "Intermediate", color: "bg-blue-500" },
      AI_SUMMARY_ADVANCED: { label: "Advanced", color: "bg-purple-500" },
      AI_SUMMARY: { label: "Summary", color: "bg-gray-500" },
    };

    const level = levelMap[type as keyof typeof levelMap] || {
      label: "Note",
      color: "bg-gray-500",
    };

    return <Badge className={level.color}>{level.label}</Badge>;
  };

  if (status === "loading" || !isClient) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              My Notes
            </CardTitle>
            <CardDescription>
              Loading your saved notes and AI summaries...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center">
              <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Notes
            </CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!notesData || notesData.notes.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              My Notes
            </CardTitle>
            <CardDescription>
              {"You don't have any saved notes or AI summaries yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground mb-4">
                Browse articles and use the AI Summarize feature to create
                summaries
              </p>
              <Button asChild>
                <Link href="/wiki">Browse Articles</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            My Notes
          </CardTitle>
          <CardDescription>Your saved notes and AI summaries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {notesData.notes.map((note: Note) => (
              <Card key={note.id} className="overflow-hidden py-0">
                <CardHeader className="bg-muted/60 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/wiki/${note.article.slug}`}
                        className="font-medium hover:underline"
                      >
                        {note.article.title}
                      </Link>
                      {renderSummaryLevel(note.type)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/wiki/${note.article.slug}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Created {formatDate(new Date(note.createdAt))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose-sm dark:prose-invert max-w-none pb-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {note.content}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

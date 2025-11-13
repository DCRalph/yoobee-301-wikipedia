"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Trophy,
  Clock,
  MousePointer,
  Target,
  ArrowRight,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

export default function GameResultsPage() {
  const params = useParams();
  const gameSessionId = params.gameSessionId as string;

  const {
    data: gameResult,
    isLoading,
    error,
  } = api.game.getGameResult.useQuery({
    gameSessionId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-4">Loading game results...</p>
        </div>
      </div>
    );
  }

  if (error || !gameResult) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">
                {error?.message ?? "Game not found"}
              </p>
              <Link href="/play/six-degrees">
                <Button>Back to Six Degrees</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = gameResult.status === "COMPLETED";
  const isForfeited = gameResult.status === "FORFEITED";

  // Calculate total duration
  const totalDuration =
    gameResult.endTime && gameResult.startTime
      ? Math.round(
        (gameResult.endTime.getTime() - gameResult.startTime.getTime()) /
        1000,
      )
      : null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          {isCompleted && <Trophy className="h-8 w-8 text-yellow-500" />}
          {isForfeited && <Target className="text-muted-foreground h-8 w-8" />}
          <h1 className="text-4xl font-bold">
            {isCompleted ? "Challenge Complete!" : "Challenge Forfeited"}
          </h1>
        </div>

        <div className="text-muted-foreground flex items-center justify-center gap-2 text-lg">
          <span>From</span>
          <Badge variant="outline" className="font-semibold">
            {gameResult.startArticle.title}
          </Badge>
          <ArrowRight className="h-4 w-4" />
          <Badge variant="outline" className="font-semibold">
            {gameResult.endArticle.title}
          </Badge>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MousePointer className="h-5 w-5" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gameResult.clicks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalDuration ? formatDuration(totalDuration) : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Date Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {format(gameResult.createdAt, "MMM d, yyyy")}
            </div>
            <div className="text-muted-foreground text-sm">
              {formatDistanceToNow(gameResult.createdAt, { addSuffix: true })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Path Taken */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Path</CardTitle>
          <CardDescription>
            The sequence of articles you visited during this challenge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gameResult.detailedPath.map((pathItem, index) => {
              const prevTimestamp =
                index > 0
                  ? gameResult.detailedPath[index - 1]?.timestamp
                  : null;
              const currentTimestamp = pathItem.timestamp;

              let stepDuration = null;
              if (prevTimestamp && currentTimestamp) {
                const prev = new Date(prevTimestamp);
                const current = new Date(currentTimestamp);
                stepDuration = Math.round(
                  (current.getTime() - prev.getTime()) / 1000,
                );
              }

              return (
                <div
                  key={index}
                  className="bg-muted/30 flex items-center gap-4 rounded-lg p-3"
                >
                  <div className="shrink-0">
                    <Badge
                      variant={
                        index === 0
                          ? "default"
                          : index === gameResult.detailedPath.length - 1 &&
                            isCompleted
                            ? "default"
                            : "secondary"
                      }
                    >
                      {index + 1}
                    </Badge>
                  </div>

                  <div className="flex-grow">
                    <Link
                      href={`/wiki/${pathItem.article?.slug}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {pathItem.article?.title ?? "Unknown Article"}
                    </Link>
                    {index === 0 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Start
                      </Badge>
                    )}
                    {index === gameResult.detailedPath.length - 1 &&
                      isCompleted && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Target Reached
                        </Badge>
                      )}
                  </div>

                  {stepDuration && (
                    <div className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {formatDuration(stepDuration)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Link href="/play/six-degrees">
          <Button size="lg" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Play Again
          </Button>
        </Link>

        <Link href="/leaderboards/six-degrees">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <Trophy className="mr-2 h-4 w-4" />
            View Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

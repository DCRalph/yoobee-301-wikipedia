"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Trophy,
  Clock,
  MousePointer,
  Medal,
  ArrowRight,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function SixDegreesLeaderboardPage() {
  const [page, setPage] = useState(0);
  const limit = 10;

  const {
    data: leaderboard,
    isLoading,
    refetch,
  } = api.game.getLeaderboard.useQuery({
    limit,
    offset: page * limit,
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <div className="text-muted-foreground flex h-5 w-5 items-center justify-center text-sm font-bold">
            #{rank}
          </div>
        );
    }
  };

  const handleNextPage = () => {
    if (leaderboard && leaderboard.length === limit) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Six Degrees Leaderboard</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Hall of fame for players who completed the Six Degrees challenge in
          the fewest clicks and fastest time.
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/play/six-degrees">
          <Button>
            <Trophy className="mr-2 h-4 w-4" />
            Play Six Degrees
          </Button>
        </Link>

        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Performers
          </CardTitle>
          <CardDescription>
            Ranked by fewest clicks, then by completion time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <p className="text-muted-foreground mt-4">
                Loading leaderboard...
              </p>
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div className="py-8 text-center">
              <Trophy className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-4">
                No completed games yet!
              </p>
              <Link href="/play/six-degrees">
                <Button>Be the first to complete a challenge</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((game, index) => {
                const rank = page * limit + index + 1;

                return (
                  <div
                    key={game.id}
                    className="bg-muted/30 hover:bg-muted/50 flex items-center gap-4 rounded-lg p-4 transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex w-12 shrink-0 justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Player Info */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={game.user.image ?? undefined} />
                        <AvatarFallback>
                          {game.user.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {game.user.name ?? "Anonymous"}
                        </div>
                      </div>
                    </div>

                    {/* Challenge Info */}
                    <div className="text-muted-foreground hidden min-w-0 items-center gap-2 text-sm md:flex">
                      <span className="max-w-24 truncate">
                        {game.startArticle.title}
                      </span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="max-w-24 truncate">
                        {game.endArticle.title}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MousePointer className="text-primary h-4 w-4" />
                        <span className="font-semibold">{game.clicks}</span>
                        <span className="text-muted-foreground hidden sm:inline">
                          clicks
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="text-primary h-4 w-4" />
                        <span className="font-semibold">
                          {formatDuration(game.duration)}
                        </span>
                      </div>

                      <div className="text-muted-foreground hidden items-center gap-1 lg:flex">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDistanceToNow(game.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {leaderboard && leaderboard.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={page === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <span className="text-muted-foreground text-sm">
                Showing {page * limit + 1}-{page * limit + leaderboard.length}{" "}
                results
              </span>

              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={leaderboard.length < limit}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">How Rankings Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Primary Ranking: Clicks</h4>
              <p className="text-muted-foreground text-sm">
                Players are ranked primarily by the number of clicks (articles
                visited) to complete the challenge. Fewer clicks = higher
                ranking.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Tiebreaker: Time</h4>
              <p className="text-muted-foreground text-sm">
                When players have the same number of clicks, the faster
                completion time breaks the tie. This rewards both efficiency and
                speed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

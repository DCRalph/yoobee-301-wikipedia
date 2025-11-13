"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Trophy,
  Medal,
  Award,
  Clock,
  MousePointer,
  Users,
  TrendingUp,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import Image from "next/image";

// Helper function to format duration
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

// Component for ranking badge
const RankingBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  } else if (rank === 2) {
    return <Medal className="h-5 w-5 text-gray-400" />;
  } else if (rank === 3) {
    return <Award className="h-5 w-5 text-amber-600" />;
  }
  return <span className="text-muted-foreground font-bold">#{rank}</span>;
};

// Loading skeleton for leaderboard rows
const LeaderboardSkeleton = () => (
  <>
    {[...(Array(10) as number[])].map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <Skeleton className="h-4 w-8" />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

export default function LeaderboardPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 25;

  const {
    data: leaderboard,
    isLoading,
    error,
  } = api.game.getLeaderboard.useQuery({
    limit: itemsPerPage,
    offset: currentPage * itemsPerPage,
  });

  // Get total games count for stats
  const { data: stats } = api.game.getLeaderboard.useQuery({
    limit: 100, // Get more for stats calculation
    offset: 0,
  });

  const totalGames = stats?.length ?? 0;
  const averageClicks =
    stats && stats.length > 0
      ? Math.round(
        stats.reduce((sum, game) => sum + game.clicks, 0) / stats.length,
      )
      : 0;
  const bestTime =
    stats && stats.length > 0
      ? stats
        .map((game) => game.duration)
        .filter((d): d is number => d !== null)
        .reduce((min, curr) => (curr < min ? curr : min), Infinity)
      : 0;

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">
                Failed to load leaderboard: {error.message}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-3 rounded-lg border border-yellow-200 bg-linear-to-r from-yellow-50 to-amber-50 px-6 py-3">
          <Trophy className="h-8 w-8 text-yellow-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Six Degrees Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Compete for the fastest path between Wikipedia articles
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-500" />
              Total Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : totalGames.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-sm">
              Completed challenges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MousePointer className="h-5 w-5 text-green-500" />
              Average Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : averageClicks}
            </div>
            <p className="text-muted-foreground text-sm">Clicks per game</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-purple-500" />
              Best Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading
                ? "..."
                : bestTime > 0
                  ? formatDuration(bestTime)
                  : "—"}
            </div>
            <p className="text-muted-foreground text-sm">Fastest completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Players
          </CardTitle>
          <CardDescription>
            Rankings based on fewest clicks to complete the challenge. Same
            click count is ranked by completion time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="w-20">Clicks</TableHead>
                <TableHead className="w-24">Time</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead className="w-32">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LeaderboardSkeleton />
              ) : leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((game, index) => {
                  const rank = currentPage * itemsPerPage + index + 1;
                  return (
                    <TableRow key={game.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <RankingBadge rank={rank} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {game.user.image ? (
                              <Image
                                src={game.user.image}
                                alt={game.user.name ?? "User"}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="bg-muted flex h-full w-full items-center justify-center text-xs font-medium">
                                {(game.user.name ?? "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </Avatar>
                          <span className="font-medium">
                            {game.user.name ?? "Anonymous"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {game.clicks}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {game.duration ? formatDuration(game.duration) : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Link
                            href={`/wiki/${game.startArticle.slug}`}
                            className="max-w-20 truncate text-blue-600 hover:underline"
                            title={game.startArticle.title}
                          >
                            {game.startArticle.title}
                          </Link>
                          <ArrowRight className="text-muted-foreground h-3 w-3 shrink-0" />
                          <Link
                            href={`/wiki/${game.endArticle.slug}`}
                            className="max-w-20 truncate text-blue-600 hover:underline"
                            title={game.endArticle.title}
                          >
                            {game.endArticle.title}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(new Date(game.createdAt), "MMM d")}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(game.createdAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Trophy className="text-muted-foreground h-8 w-8" />
                      <p className="text-muted-foreground">
                        No games completed yet
                      </p>
                      <Link href="/play/six-degrees">
                        <Button variant="outline" size="sm">
                          Play First Game
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {leaderboard && leaderboard.length === itemsPerPage && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {currentPage + 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={leaderboard.length < itemsPerPage}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="text-muted-foreground h-5 w-5" />
              <h3 className="text-lg font-semibold">Ready to compete?</h3>
            </div>
            <p className="text-muted-foreground">
              Challenge yourself to find the shortest path between Wikipedia
              articles and climb the leaderboard!
            </p>
            <Link href="/play/six-degrees">
              <Button size="lg" className="gap-2">
                <Trophy className="h-4 w-4" />
                Start New Game
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

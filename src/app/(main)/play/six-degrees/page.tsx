"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Loader2, Play, Trophy, ArrowRight, LogIn } from "lucide-react";
import Link from "next/link";
import { ArticleSelector } from "~/components/game/article-selector";

type SearchArticle = {
  id: string;
  title: string;
  slug: string;
  author: { name: string };
  updatedAt: Date;
  category: string;
  readTime: string;
  similarity?: number;
};

export default function SixDegreesChallengePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [isStarting, setIsStarting] = useState(false);
  const [startArticle, setStartArticle] = useState<SearchArticle | null>(null);
  const [endArticle, setEndArticle] = useState<SearchArticle | null>(null);

  const startGameMutation = api.game.startGame.useMutation({
    onSuccess: (gameSession) => {
      // Invalidate the active game query to update the banner
      void utils.game.getActiveGame.invalidate();
      // Redirect to the start article
      router.push(`/wiki/${gameSession.startArticle.slug}`);
    },
    onError: (error) => {
      console.error("Failed to start game:", error);
      setIsStarting(false);
    },
  });

  const { data: activeGame } = api.game.getActiveGame.useQuery();

  const handleStartGame = () => {
    if (!startArticle || !endArticle) return;

    setIsStarting(true);
    startGameMutation.mutate({
      startArticleId: startArticle.id,
      endArticleId: endArticle.id,
    });
  };

  const handleContinueGame = () => {
    if (activeGame) {
      // Navigate to the current article if available, otherwise go to start article
      const targetArticle =
        activeGame.currentArticle ?? activeGame.startArticle;
      router.push(`/wiki/${targetArticle.slug}`);
    }
  };

  const canStartGame =
    startArticle && endArticle && !isStarting && !startGameMutation.isPending;

  // Show sign-in required message if user is not authenticated
  if (!session?.user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">
            Six Degrees of Wiki Separation
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Choose your starting and target articles, then navigate from one to
            another using only the links within articles. Can you find the
            connection in the fewest clicks?
          </p>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In Required
            </CardTitle>
            <CardDescription>
              Please sign in to play Six Degrees of Wiki Separation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">
              You need to be signed in to start game sessions and track your
              progress.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() =>
                  router.push("/signin?redirect_url=/play/six-degrees")
                }
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In to Play
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">
          Six Degrees of Wiki Separation
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Choose your starting and target articles, then navigate from one to
          another using only the links within articles. Can you find the
          connection in the fewest clicks?
        </p>
      </div>

      {/* Active Game Alert */}
      {activeGame && (
        <Card className="border-primary/20 bg-primary/5 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Game in Progress
            </CardTitle>
            <CardDescription>
              {`You have an active game from "${activeGame.startArticle.title}" to
              "${activeGame.endArticle.title}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button onClick={handleContinueGame} className="w-full">
                Continue Current Game
              </Button>
              <p className="text-muted-foreground text-center text-sm">
                Clicks so far: {activeGame.clicks}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Article Selection Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Select Your Challenge
            </CardTitle>
            <CardDescription>
              Choose a starting article and target article to create your own
              Six Degrees challenge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ArticleSelector
                label="Starting Article"
                placeholder="Search for your starting article..."
                selectedArticle={startArticle}
                onSelect={setStartArticle}
                disabled={!!activeGame}
              />

              <ArticleSelector
                label="Target Article"
                placeholder="Search for your target article..."
                selectedArticle={endArticle}
                onSelect={setEndArticle}
                disabled={!!activeGame}
              />
            </div>

            {/* Preview */}
            {startArticle && endArticle && (
              <Card className="border-muted">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <span className="text-primary font-medium">
                      {startArticle.title}
                    </span>
                    <ArrowRight className="text-muted-foreground h-4 w-4" />
                    <span className="text-primary font-medium">
                      {endArticle.title}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-center text-xs">
                    Navigate from the starting article to the target article
                    using only internal links
                  </p>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleStartGame}
              disabled={!canStartGame || !!activeGame}
              className="w-full"
              size="lg"
            >
              {isStarting || startGameMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Challenge...
                </>
              ) : (
                "Start Six Degrees Challenge"
              )}
            </Button>

            {startGameMutation.error && (
              <p className="text-destructive text-center text-sm">
                {startGameMutation.error.message}
              </p>
            )}

            {!startArticle || !endArticle ? (
              <p className="text-muted-foreground text-center text-xs">
                Select both starting and target articles to begin
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Leaderboard Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </CardTitle>
            <CardDescription>
              See who has completed challenges in the fewest clicks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/leaderboards/six-degrees">
                <Button variant="outline" className="w-full">
                  View Full Leaderboard
                </Button>
              </Link>
              <p className="text-muted-foreground text-center text-sm">
                Compete with other players for the best scores
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How to Play Section */}
        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                  <span className="text-primary text-sm font-bold">1</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Choose Articles</h3>
                  <p className="text-muted-foreground text-sm">
                    Select your starting article and target article using the
                    search
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                  <span className="text-primary text-sm font-bold">2</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Navigate</h3>
                  <p className="text-muted-foreground text-sm">
                    Click links within articles to navigate toward your target
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                  <span className="text-primary text-sm font-bold">3</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Complete</h3>
                  <p className="text-muted-foreground text-sm">
                    Reach the target article in as few clicks as possible
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

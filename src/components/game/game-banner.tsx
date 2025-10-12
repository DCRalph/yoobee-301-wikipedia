"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Target, Flag, Loader2, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";

export function GameBanner() {
  const router = useRouter();
  const [isForfeitng, setIsForfeiting] = useState(false);
  const { data: activeGame } = api.game.getActiveGame.useQuery();

  const forfeitMutation = api.game.forfeitGame.useMutation({
    onSuccess: (gameSession) => {
      // Redirect to results page
      router.push(`/play/six-degrees/results/${gameSession.id}`);
    },
    onError: (error) => {
      console.error("Failed to forfeit game:", error);
      setIsForfeiting(false);
    },
  });

  const handleForfeit = () => {
    if (activeGame && !isForfeitng) {
      setIsForfeiting(true);
      forfeitMutation.mutate({ gameSessionId: activeGame.id });
    }
  };

  // Don't show banner if no active game
  if (!activeGame) {
    return null;
  }

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 backdrop-blur">
      <div className="container mx-auto px-4 py-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              {/* Game Info */}
              <div className="flex items-center gap-3 text-sm">
                <Target className="text-primary h-4 w-4" />
                <div className="flex items-center gap-2">
                  <span className="font-medium">Six Degrees Challenge:</span>
                  <span className="text-muted-foreground">
                    Find your way from
                  </span>
                  <span className="text-primary font-semibold">
                    {activeGame.startArticle.title}
                  </span>
                  <ArrowRight className="text-muted-foreground h-3 w-3" />
                  <span className="text-primary font-semibold">
                    {activeGame.endArticle.title}
                  </span>
                </div>
              </div>

              {/* Game Stats and Actions */}
              <div className="flex items-center gap-4">
                <div className="text-muted-foreground text-sm">
                  <span className="font-medium">Clicks:</span>{" "}
                  {activeGame.clicks}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleForfeit}
                  disabled={isForfeitng || forfeitMutation.isPending}
                  className="border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                >
                  {isForfeitng || forfeitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Forfeiting...
                    </>
                  ) : (
                    <>
                      <Flag className="mr-2 h-3 w-3" />
                      Forfeit Challenge
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Error handling */}
            {forfeitMutation.error && (
              <Alert className="mt-3">
                <AlertDescription>
                  Failed to forfeit game: {forfeitMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

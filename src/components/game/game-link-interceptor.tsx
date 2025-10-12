"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { GameStatus } from "@prisma/client";

interface GameLinkInterceptorProps {
  children: React.ReactNode;
  currentArticleId: string;
}

export function GameLinkInterceptor({
  children,
  currentArticleId,
}: GameLinkInterceptorProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  const { data: activeGame } = api.game.getActiveGame.useQuery();
  const [slug, setSlug] = useState("");

  const makeMoveMutation = api.game.makeMove.useMutation({
    onSuccess: (gameSession) => {
      // Invalidate the active game query to update the banner
      void utils.game.getActiveGame.invalidate();

      // Check if the game is completed by looking at the session status
      if (gameSession.status === GameStatus.COMPLETED) {
        // Game completed, redirect to results
        router.push(`/play/six-degrees/results/${gameSession.id}`);
      } else {
        // For now, let normal navigation handle the redirect
        // The article page will reload and show the new content
        // window.location.reload();
        router.push(`/wiki/${slug}`);
      }
    },
    onError: (error) => {
      console.error("Failed to make move:", error);
      const errorMessage =
        (error as { message?: string })?.message ?? "Unknown error";
      alert(`Failed to make move: ${errorMessage}`);
    },
  });

  const handleLinkClick = useCallback(
    async (event: Event) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a[href]");

      console.log("link", link);

      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Check if this is an internal wiki link
      const isWikiLink = href.startsWith("/wiki/");

      if (!isWikiLink) return;

      // Extract slug from the href
      const slug = href.replace(/^\/wiki\//, "");

      if (!slug) return;

      // Prevent default navigation
      event.preventDefault();
      event.stopPropagation();

      try {
        console.log("Attempting to navigate to:", slug);
        console.log("Current article ID:", currentArticleId);
        console.log("Active game:", activeGame);

        // Use the game-specific API endpoint to get article ID by slug
        const nextArticle = await utils.user.articles.getBySlug.fetch({
          slug: slug,
        });

        if (nextArticle && activeGame) {
          setSlug(slug);
          makeMoveMutation.mutate({
            gameSessionId: activeGame.id,
            nextArticleId: nextArticle.id,
          });
        } else {
          console.log(
            "Article not found or no active game, navigating normally",
          );
          // Fallback: navigate normally
          router.push(href);
        }
      } catch (error) {
        console.error("Error getting article:", error);
        // Fallback: navigate normally
        router.push(href);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeGame, makeMoveMutation, router, currentArticleId],
  );

  useEffect(() => {
    if (!activeGame || !containerRef.current) return;

    const container = containerRef.current;

    const wrappedHandler = (event: Event) => {
      void handleLinkClick(event);
    };

    container.addEventListener("click", wrappedHandler);

    return () => {
      container.removeEventListener("click", wrappedHandler);
    };
  }, [activeGame, handleLinkClick]);

  // If no active game, render children normally
  if (!activeGame) {
    return <>{children}</>;
  }

  // Wrap children in a container that intercepts clicks
  return (
    <div ref={containerRef} className="game-link-interceptor">
      {children}
    </div>
  );
}

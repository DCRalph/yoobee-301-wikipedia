"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { RecentArticles } from "~/components/wiki/recent-articles";
import { BookText, Edit, Search, UserCog } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return (
    <div className="container mx-auto px-8 py-8">
      <section className="mb-16 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Modern Wikipedia Clone
        </h1>
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
          A community-driven knowledge base with articles on various topics.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/wiki">
              <BookText className="mr-2 h-5 w-5" />
              Browse Articles
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/wiki/create">
              <Edit className="mr-2 h-5 w-5" />
              Create Article
            </Link>
          </Button>
          {isAuthenticated && (
            <Button size="lg" variant="outline" asChild>
              <Link href="/account">
                <UserCog className="mr-2 h-5 w-5" />
                Manage Account
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="mb-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Recent Articles</h2>
          <Button variant="outline" asChild>
            <Link href="/wiki">
              <Search className="mr-2 h-4 w-4" />
              View All
            </Link>
          </Button>
        </div>
        <RecentArticles />
      </section>
    </div>
  );
}

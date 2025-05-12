"use client";

import Link from "next/link";
import { ThemeToggle } from "~/components/theme-toggle";
import { UserMenu } from "./user-menu";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { BookText, Settings, StickyNote, Brain } from "lucide-react";
import { api } from "~/trpc/react";

export function Header() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  // const isModerator = session?.user?.role === Role.MODERATOR;
  const canAccessAdmin = isAdmin;
  const isAuthenticated = !!session?.user;

  // Fetch public settings to check if AI features are enabled
  const { data: settings } = api.admin.settings.getPublic.useQuery();
  const showAIFeatures = settings?.enableAIFeatures;

  return (
    <header className="bg-background/95 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="font-bold">
            WikiClone
          </Link>
        </div>

        {/* Main navigation */}
        <nav className="hidden md:block">
          <ul className="flex gap-6">
            <li>
              <Link
                href="/wiki"
                className="hover:text-foreground flex items-center gap-2 text-sm"
              >
                <BookText className="h-4 w-4" />
                Articles
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link
                  href="/notes"
                  className="hover:text-foreground flex items-center gap-2 text-sm"
                >
                  <StickyNote className="h-4 w-4" />
                  My Notes
                </Link>
              </li>
            )}
            {showAIFeatures && (
              <li>
                <Link
                  href="/testing"
                  className="hover:text-foreground flex items-center gap-2 text-sm"
                >
                  <Brain className="h-4 w-4" />
                  AI Testing
                </Link>
              </li>
            )}
            {canAccessAdmin && (
              <li>
                <Link
                  href="/admin"
                  className="hover:text-foreground flex items-center gap-2 text-sm"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

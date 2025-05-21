"use client";

import Link from "next/link";
import { UserMenu } from "./user-menu";
// import { useSession } from "next-auth/react";
// import { Role } from "@prisma/client";
import { BookText, Brain, Home, Heart } from "lucide-react";
import { api } from "~/trpc/react";
import { SearchDialog } from "~/components/wiki/SearchDialog";

export function Header() {
  // const { data: session } = useSession();
  // const isAdmin = session?.user?.role === Role.ADMIN;
  // const isModerator = session?.user?.role === Role.MODERATOR;
  // const canAccessAdmin = isAdmin;
  // const isAuthenticated = !!session?.user;

  // Fetch public settings to check if AI features are enabled
  const { data: settings } = api.admin.settings.getPublic.useQuery();
  const showAIFeatures = settings?.enableAIFeatures;

  return (
    <header className="bg-[#2E1503] text-white sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="font-bold">
            WikiClone
          </Link>
        </div>

        {/* Main navigation */}
        <nav className="hidden md:flex items-center gap-3">
          <ul className="flex gap-6 mr-8">
            <li>
              <Link
                href="/"
                className="hover:text-popover flex items-center gap-2 text-sm"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/wiki"
                className="hover:text-popover flex items-center gap-2 text-sm"
              >
                <BookText className="h-4 w-4" />
                Articles
              </Link>
            </li>

            <li>
              <Link
                href="/donate"
                className="hover:text-popover flex items-center gap-2 text-sm"
              >
                <Heart className="h-4 w-4" />
                Donate
              </Link>
            </li>

            {/* {isAuthenticated && (
              <li>
                <Link
                  href="/notes"
                  className="hover:text-popover flex items-center gap-2 text-sm"
                >
                  <StickyNote className="h-4 w-4" />
                  My Notes
                </Link>
              </li>
            )} */}
            {showAIFeatures && (
              <li>
                <Link
                  href="/testing"
                  className="hover:text-popover flex items-center gap-2 text-sm"
                >
                  <Brain className="h-4 w-4" />
                  AI Testing
                </Link>
              </li>
            )}
            {/* {canAccessAdmin && (
              <li>
                <Link
                  href="/admin"
                  className="hover:text-popover flex items-center gap-2 text-sm"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              </li>
            )} */}
          </ul>

          <div className="flex items-center gap-3 mr-8">
            <SearchDialog />
          </div>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

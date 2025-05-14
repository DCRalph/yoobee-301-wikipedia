"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import {
  User,
  LogOut,
  Settings,
  BookText,
  Plus,
  LogIn,
  UserCog,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import Image from "next/image";

export function UserMenu() {
  const { data: session } = useSession();

  // If not signed in, show sign in button
  if (!session) {
    return (
      <Button variant="outline" size="sm" onClick={() => void signIn()}>
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    );
  }

  // User roles
  const isAdmin = session.user?.role === Role.ADMIN;
  // const isModerator = session.user?.role === Role.MODERATOR;
  const canAccessAdmin = isAdmin;

  // User avatar/image
  const userImage = session.user?.image ? (
    <Image
      src={session.user.image}
      alt={session.user.name ?? "User"}
      className="h-8 w-8 rounded-full"
      width={32}
      height={32}
    />
  ) : (
    <User className="h-4 w-4" />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full"
        >
          {userImage}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="bg-[#2E1503]/80 backdrop-blur-lg">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{session.user?.name ?? "User"}</span>
            {session.user?.email && (
              <span className="text-muted-foreground text-xs">
                {session.user.email}
              </span>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserCog className="mr-2 h-4 w-4" />
            Your Account
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/wiki">
            <BookText className="mr-2 h-4 w-4" />
            Browse Articles
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/wiki/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Article
          </Link>
        </DropdownMenuItem>

        {canAccessAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Settings className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

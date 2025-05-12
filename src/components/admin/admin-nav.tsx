"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ChevronDown,
  Plus,
  FileCheck,
  History,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";

type NavItem = {
  name: string;
  icon: React.ElementType;
} & (
    | { href: string; children?: never }
    | { href?: never; children: NavItem[] }
  );

export function AdminNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      icon: Users,
      children: [
        {
          name: "Overview",
          href: "/admin/users",
          icon: Users,
        },
        {
          name: "Add User",
          href: "/admin/users/new",
          icon: Plus,
        },
      ],
    },
    {
      name: "Articles",
      icon: FileText,
      children: [
        {
          name: "Overview",
          href: "/admin/articles",
          icon: FileText,
        },
        {
          name: "Approvals",
          href: "/admin/approvals",
          icon: FileCheck,
        },
        {
          name: "Revisions",
          href: "/admin/revisions",
          icon: History,
        },
      ],
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  // Function to check if a nav item is active
  const isNavItemActive = (item: NavItem) => {
    if (item.href) {
      if (item.href === "/admin") {
        return pathname === "/admin";
      }
      // Check for exact match first, then for parent routes but only if not a specific subpage
      return (
        pathname === item.href ||
        (pathname.startsWith(`${item.href}/`) &&
          !/\/(new|edit|[0-9a-f-]+)$/.test(pathname))
      );
    }

    // Check if any child items are active
    if (item.children) {
      return item.children.some((child) => {
        if (child.href === "/admin") {
          return pathname === "/admin";
        }
        return pathname === child.href;
      });
    }

    return false;
  };

  const renderNavItem = (item: NavItem) => {
    if (item.children) {
      return (
        <DropdownMenu key={item.name}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex h-10 items-center gap-2 px-4 transition-colors",
                isNavItemActive(item)
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/80",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48 p-1">
            {item.children.map((child) => (
              <DropdownMenuItem key={child.href} asChild className="p-0">
                <Link
                  href={child.href!}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-3 py-2 transition-colors",
                    isNavItemActive(child)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  <child.icon className="h-4 w-4" />
                  {child.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Button
        key={item.href}
        variant="ghost"
        asChild
        className={cn(
          "h-10 px-4 transition-colors",
          isNavItemActive(item)
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted/80",
        )}
      >
        <Link href={item.href} className="flex items-center gap-2">
          <item.icon className="h-4 w-4" />
          <span>{item.name}</span>
        </Link>
      </Button>
    );
  };

  return (
    <nav className="bg-card sticky top-0 z-10 border-b shadow-sm">
      <div className=" flex h-16 items-center justify-center px-4">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          {navItems.map((item) => renderNavItem(item))}
        </div>
      </div>
    </nav>
  );
}

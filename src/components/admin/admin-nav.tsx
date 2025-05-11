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
          name: "Create New",
          href: "/admin/articles/new",
          icon: Plus,
        },
        {
          name: "Approvals",
          href: "/admin/approvals",
          icon: FileCheck,
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
      return pathname.startsWith(`${item.href}/`) || pathname === item.href;
    }

    // Check if any child items are active
    if (item.children) {
      return item.children.some((child) => {
        if (child.href === "/admin") {
          return pathname === "/admin";
        }
        return pathname.startsWith(`${child.href}/`) || pathname === child.href;
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
                "flex items-center gap-2",
                isNavItemActive(item) && "bg-muted",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {item.children.map((child) => (
              <DropdownMenuItem key={child.href} asChild>
                <Link
                  href={child.href!}
                  className={cn(
                    "flex items-center gap-2",
                    isNavItemActive(child) && "bg-muted",
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
          "flex items-center gap-2",
          isNavItemActive(item) && "bg-muted",
        )}
      >
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.name}</span>
        </Link>
      </Button>
    );
  };

  return (
    <nav className="bg-card border-b">
      <div className="container flex h-14 items-center justify-center px-4">
        <div className="flex items-center space-x-4">
          {navItems.map((item) => renderNavItem(item))}
        </div>
      </div>
    </nav>
  );
}

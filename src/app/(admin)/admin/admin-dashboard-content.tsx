"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Users, FileText, FileCheck, FilePen, ArrowRight } from "lucide-react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/react";
import Image from "next/image";

// Define types for the dashboard data
type DashboardData = RouterOutputs["admin"]["dashboard"]["getDashboardStats"];
type DashboardUser = DashboardData["recentUsers"][number];
type DashboardArticle = DashboardData["recentArticles"][number];

export function AdminDashboardContent() {
  const [mounted, setMounted] = useState(false);

  // Get all dashboard stats in a single query
  const { data: dashboardData, isLoading } =
    api.admin.dashboard.getDashboardStats.useQuery(undefined, {
      enabled: mounted,
    });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Define stats based on the dashboard data
  const stats = [
    {
      title: "Total Users",
      value: dashboardData?.stats.totalUsers ?? 0,
      description: "User accounts",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Total Articles",
      value: dashboardData?.stats.totalArticles ?? 0,
      description: "All articles",
      icon: FileText,
      href: "/admin/articles",
    },
    {
      title: "Published",
      value: dashboardData?.stats.totalPublishedArticles ?? 0,
      description: "Live articles",
      icon: FileCheck,
      href: "/admin/articles?status=published",
    },
    {
      title: "Drafts",
      value: dashboardData?.stats.totalDraftArticles ?? 0,
      description: "Unpublished articles",
      icon: FilePen,
      href: "/admin/articles?status=draft",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground text-xs">
                {stat.description}
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={stat.href}
                className="flex items-center text-xs text-blue-500"
              >
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Articles</CardTitle>
            <CardDescription>
              Recently created or modified articles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">
                Loading articles...
              </p>
            ) : dashboardData?.recentArticles.length ? (
              <div className="space-y-2">
                {dashboardData.recentArticles.map(
                  (article: DashboardArticle) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="ml-2">
                          <p className="text-sm leading-none font-medium">
                            {article.title}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {article.published ? "Published" : "Draft"}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="text-xs text-blue-500"
                      >
                        View
                      </Link>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No articles found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Recently registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading users...</p>
            ) : dashboardData?.recentUsers.length ? (
              <div className="space-y-2">
                {dashboardData.recentUsers.map((user: DashboardUser) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {user.image && (
                        <Image
                          src={user.image}
                          alt={user.name ?? "User"}
                          className="h-8 w-8 rounded-full"
                          width={32}
                          height={32}
                        />
                      )}
                      <div className="ml-2">
                        <p className="text-sm leading-none font-medium">
                          {user.name ?? "Anonymous"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {user.articles.length} articles
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs text-blue-500"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No users found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

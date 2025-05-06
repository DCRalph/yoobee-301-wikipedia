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
import Image from "next/image";
export function AdminDashboardContent() {
  const [mounted, setMounted] = useState(false);

  // Get users and articles stats
  const { data: users } = api.users.getAll.useQuery(
    { limit: 100 },
    { enabled: mounted },
  );
  const { data: publishedArticles } = api.articles.getAll.useQuery(
    { filterPublished: true, limit: 100 },
    { enabled: mounted },
  );
  const { data: draftArticles } = api.articles.getAll.useQuery(
    { filterPublished: false, limit: 100 },
    { enabled: mounted },
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    {
      title: "Total Users",
      value: users?.users.length ?? 0,
      description: "User accounts",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Total Articles",
      value:
        (publishedArticles?.articles.length ?? 0) +
        (draftArticles?.articles.length ?? 0),
      description: "All articles",
      icon: FileText,
      href: "/admin/articles",
    },
    {
      title: "Published",
      value: publishedArticles?.articles.length ?? 0,
      description: "Live articles",
      icon: FileCheck,
      href: "/admin/articles?status=published",
    },
    {
      title: "Drafts",
      value: draftArticles?.articles.length ?? 0,
      description: "Unpublished articles",
      icon: FilePen,
      href: "/admin/articles?status=draft",
    },
  ];

  return (
    <div className="space-y-8">
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
            {publishedArticles && draftArticles ? (
              <div className="space-y-2">
                {[
                  ...(publishedArticles.articles || []),
                  ...(draftArticles.articles || []),
                ]
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime(),
                  )
                  .slice(0, 5)
                  .map((article) => (
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
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Loading articles...
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Recently registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {users ? (
              <div className="space-y-2">
                {users.users.slice(0, 5).map((user) => (
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
              <p className="text-muted-foreground text-sm">Loading users...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

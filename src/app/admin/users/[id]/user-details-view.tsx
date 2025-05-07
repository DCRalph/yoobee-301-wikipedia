"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  User,
  Mail,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  UserCog,
} from "lucide-react";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;

type InferedUser = RouterOutput["users"]["getById"];

interface UserDetailsViewProps {
  user: InferedUser;
}

export function UserDetailsView({ user }: UserDetailsViewProps) {
  const router = useRouter();
  const [role, setRole] = useState<string>(user?.role ?? "");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Role update mutation
  const updateRoleMutation = api.users.updateRole.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Handle role change
  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    updateRoleMutation.mutate({
      id: user?.id ?? "",
      role: newRole as Role,
    });
  };

  // Get role badge
  const getRoleBadge = (userRole: Role) => {
    switch (userRole) {
      case Role.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
            <Shield className="h-3 w-3" />
            Admin
          </span>
        );
      case Role.MODERATOR:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <UserCog className="h-3 w-3" />
            Moderator
          </span>
        );
      case Role.USER:
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <User className="h-3 w-3" />
            User
          </span>
        );
    }
  };

  if (user == null) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
          <FileText className="text-muted-foreground/60 mb-2 h-10 w-10" />
          <p className="mb-1">No user found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => router.push("/admin/users")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
        </div>
        <div className="flex items-center">
          {getRoleBadge(user.role)}
        </div>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>User role updated successfully</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>User account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User"}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
                  <User className="text-muted-foreground h-10 w-10" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {user.name ?? "Anonymous"}
                </h2>
                <div className="mt-1">{getRoleBadge(user.role)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span>{user.email ?? "No email provided"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">User ID</Label>
                <div className="font-mono text-xs">{user.id}</div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">
                  Articles Count
                </Label>
                <div className="flex items-center gap-2">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  <span>{user.articles.length} articles</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>Update user permissions and role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="USER">Regular User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium">Role Permissions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Access Admin Dashboard</span>
                  <span>
                    {role === "ADMIN" || role === "MODERATOR" ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Manage Users</span>
                  <span>{role === "ADMIN" ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Edit All Articles</span>
                  <span>
                    {role === "ADMIN" || role === "MODERATOR" ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delete Articles</span>
                  <span>{role === "ADMIN" ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Articles */}
      <Card>
        <CardHeader>
          <CardTitle>User Articles</CardTitle>
          <CardDescription>Articles created by this user</CardDescription>
        </CardHeader>
        <CardContent>
          {user.articles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      {article.title}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {article.slug}
                    </TableCell>
                    <TableCell>
                      {article.published ? (
                        <span className="text-green-600">Published</span>
                      ) : (
                        <span className="text-amber-600">Draft</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <Link href={`/admin/articles/${article.id}`}>
                            <span className="sr-only">Edit</span>
                            <FileText className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <Link href={`/wiki/${article.slug}`}>
                            <span className="sr-only">View</span>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
              <FileText className="text-muted-foreground/60 mb-2 h-10 w-10" />
              <p className="mb-1">No articles yet</p>
              <p className="text-sm">
                {"This user hasn't created any articles."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

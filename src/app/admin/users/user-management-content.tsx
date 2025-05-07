"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Role } from "@prisma/client";
import { api } from "~/trpc/react";
import {
  Search,
  MoreHorizontal,
  UserCog,
  Shield,
  UserPlus,
  Users,
  User,
} from "lucide-react";
import Image from "next/image";

export function UserManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFilter = searchParams.get("role");

  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Query users with tRPC
  const { data, isLoading, refetch } = api.users.getAll.useQuery(
    { limit: 100 },
    { enabled: mounted },
  );

  // Role update mutation
  const updateRoleMutation = api.users.updateRole.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter users based on search term and role
  const filteredUsers = data?.users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (user.name?.toLowerCase().includes(searchLower) ?? false) ||
      (user.email?.toLowerCase().includes(searchLower) ?? false);

    // If role filter is active, check if user has that role
    if (roleFilter) {
      return matchesSearch && user.role === roleFilter;
    }

    return matchesSearch;
  });

  // Handle role change
  const handleRoleChange = (userId: string, newRole: Role) => {
    updateRoleMutation.mutate({ id: userId, role: newRole });
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-4 w-4 text-red-500" />;
      case "MODERATOR":
        return <UserCog className="h-4 w-4 text-orange-500" />;
      case "USER":
      default:
        return <User className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        </div>
        <Button onClick={() => router.push("/admin/users/new")}>
          <UserPlus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant={!roleFilter ? "default" : "outline"}
            size="sm"
            onClick={() => router.push("/admin/users")}
          >
            <Users className="mr-2 h-4 w-4" />
            All Users
          </Button>
          <Button
            variant={roleFilter === "ADMIN" ? "default" : "outline"}
            size="sm"
            onClick={() => router.push("/admin/users?role=ADMIN")}
          >
            <Shield className="mr-2 h-4 w-4 text-red-500" />
            Admins
          </Button>
          <Button
            variant={roleFilter === "MODERATOR" ? "default" : "outline"}
            size="sm"
            onClick={() => router.push("/admin/users?role=MODERATOR")}
          >
            <UserCog className="mr-2 h-4 w-4 text-orange-500" />
            Moderators
          </Button>
          <Button
            variant={roleFilter === "USER" ? "default" : "outline"}
            size="sm"
            onClick={() => router.push("/admin/users?role=USER")}
          >
            <User className="mr-2 h-4 w-4 text-green-500" />
            Regular Users
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-3">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ?? "User"}
                        className="h-8 w-8 rounded-full"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                        {user.name?.[0] ?? "U"}
                      </div>
                    )}
                    <span className="font-medium">
                      {user.name ?? "Anonymous"}
                    </span>
                  </TableCell>
                  <TableCell>{user.email ?? "No email"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      {user.role}
                    </div>
                  </TableCell>
                  <TableCell>{user.articles.length}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.id, Role.ADMIN)}
                          disabled={user.role === Role.ADMIN}
                          className="text-red-500"
                        >
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleRoleChange(user.id, Role.MODERATOR)
                          }
                          disabled={user.role === Role.MODERATOR}
                        >
                          Make Moderator
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.id, Role.USER)}
                          disabled={user.role === Role.USER}
                        >
                          Set as Regular User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

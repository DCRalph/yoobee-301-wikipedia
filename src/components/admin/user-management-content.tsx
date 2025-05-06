"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  MailCheck,
  Shield,
} from "lucide-react";
import Image from "next/image";
export function UserManagementContent() {
  const router = useRouter();
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

  // Filter users based on search term
  const filteredUsers = data?.users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ??
      user.email?.toLowerCase().includes(searchLower)
    );
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
        return <MailCheck className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-4">
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

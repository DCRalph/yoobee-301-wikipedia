import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { UserDetailsView } from "./user-details-view";
import { auth } from "~/server/auth";
import { Role } from "@prisma/client";

interface UserDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: UserDetailsPageProps) {
  const { id } = await params;
  try {
    const user = await api.admin.users.getById({ id });
    return {
      title: `${user?.name ?? "User"} | Admin Dashboard`,
      description: `Manage user details for ${user?.name ?? "User"}`,
    };
  } catch {
    return {
      title: "User Details | Admin Dashboard",
      description: "View and manage user details",
    };
  }
}

export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  const { id } = await params;

  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/");
  }

  const user = await api.admin.users.getById({ id });

  return <UserDetailsView user={user} />;
}

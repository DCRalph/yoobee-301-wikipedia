import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { UserDetailsView } from "~/components/admin/user-details-view";

interface UserDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: UserDetailsPageProps) {
  const { id } = await params;
  try {
    const user = await api.users.getById({ id });
    return {
      title: `${user?.name ?? "User"} | Admin Dashboard`,
      description: `Manage user details for ${user?.name ?? "User"}`,
    };
  } catch (error) {
    return {
      title: "User Details | Admin Dashboard",
      description: "View and manage user details",
    };
  }
}

export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  try {
    const { id } = await params;
    const user = await api.users.getById({ id });

    return (
      <div className="mx-auto max-w-5xl space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground">
            View and manage user account information.
          </p>
        </div>

        <UserDetailsView user={user} />
      </div>
    );
  } catch {
    return notFound();
  }
}

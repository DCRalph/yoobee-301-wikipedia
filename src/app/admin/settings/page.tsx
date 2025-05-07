import { SettingsForm } from "./settings-form";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Role } from "@prisma/client";

export const metadata = {
  title: "Site Settings | Admin Dashboard",
  description: "Configure site-wide settings for your Wikipedia clone",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/");
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <SettingsForm />
    </div>
  );
}
import { NewUserForm } from "./new-user-form";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function NewUserPage() {

  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/");
  }


  return <NewUserForm />;
}

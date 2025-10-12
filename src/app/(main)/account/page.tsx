import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { AccountPage } from "./account-page";

export const metadata = {
  title: "Your Account",
  description: "Manage your account settings and profile information",
};

export default async function Account() {
  const session = await auth();

  if (!session) {
    redirect("/signin?redirect_url=/account");
  }

  return <AccountPage />;
}

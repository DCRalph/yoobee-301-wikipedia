import { PublicArticleForm } from "./public-article-form";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export const metadata = {
  title: "Create Article | Wiki",
  description: "Create a new article in the wiki",
};

export default async function CreateArticlePage() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return <PublicArticleForm />;
}

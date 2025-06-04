import WikiArticleListWithSuspense from "./wiki-article-list";

export const metadata = {
  title: "Articles | Modern WikiClone",
  description: "Browse all articles in our Wiki",
};

export default function page() {
  return <WikiArticleListWithSuspense />;
}

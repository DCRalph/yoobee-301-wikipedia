import { WikiArticleList } from "./wiki-article-list";

export const metadata = {
  title: "Articles | Modern Wikipedia Clone",
  description: "Browse all articles in our Wiki",
};

export default function WikiIndexPage() {
  return <WikiArticleList />;
}


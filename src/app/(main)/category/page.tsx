"use client";

import Link from "next/link";
import { api, type RouterOutputs } from "~/trpc/react";
import { FileText, Tag, Calendar, Eye, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar
} from "~/components/ui/sidebar";
import {
  TooltipProvider,
} from "~/components/ui/tooltip";
import Image from "next/image";

type CategoryWithTopArticles = RouterOutputs["category"]["getTopArticlesByCategory"][number];

const CategoryTag = ({ category }: { category: CategoryWithTopArticles }) => {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="inline-block px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-200 mr-2 mb-2"
    >
      {category.name}
    </Link>
  );
};

const ContentCard = ({ category }: { category: CategoryWithTopArticles }) => {
  const topArticle = category.topArticles[0];

  return (
    <div className="bg-card border border-border overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Placeholder image - in a real app, you'd have category images */}
      <div className="h-32 bg-gradient-to-br from-sidebar-accent to-muted flex items-center justify-center">
        <Tag className="h-8 w-8 text-primary opacity-50" />
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
          {category.description ?? `Explore ${category._count.articles} articles in ${category.name.toLowerCase()}.`}
        </p>
        {topArticle && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs font-medium text-foreground mb-1">Most viewed:</p>
            <Link
              href={`/wiki/${topArticle.slug}`}
              className="text-xs text-primary hover:underline line-clamp-2"
            >
              {topArticle.title}
            </Link>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {topArticle.viewCount.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {topArticle.author.name}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ArticleList = ({ articles, section }: { articles: CategoryWithTopArticles['topArticles'], section: string }) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No articles in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
      {articles.slice(0, 10).map((article, index) => (
        <Link
          key={`${section}-${article.id}-${index}`}
          href={`/wiki/${article.slug}`}
          className="flex items-start gap-3 p-3 bg-card border border-border hover:bg-sidebar-accent transition-colors duration-200 rounded"
        >
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
              {article.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.viewCount.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {article.author.name}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-serif text-foreground mb-1 border-b-2 border-sidebar-primary pb-2">
      {title}
    </h2>
  </div>
);

const CategorySidebar = () => {
  const { toggleSidebar } = useSidebar();

  // Close the sidebar on mobile after a link is clicked
  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setTimeout(() => toggleSidebar(), 100);
    }
  };

  return (
    <TooltipProvider>
      <Sidebar
        className="border-r border-sidebar-border bg-sidebar shadow-sm"
        variant="sidebar"
        collapsible="offcanvas"
      >
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-2 text-sidebar-foreground">
            <Tag className="h-5 w-5" />
            <h3 className="text-sm font-medium">Browse</h3>
          </div>
        </SidebarHeader>

        <SidebarContent className="overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground font-medium">Browse</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/articles/popular" className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Popular Articles</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/articles/featured" className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Featured Articles</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/articles/recent" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>On This Day</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/articles" className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Current Events</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground font-medium">Categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/category">Science</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/category">History</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/category">Geography</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/category">Arts</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/category">Technology</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/category">Biography</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/category">Society</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link href="/category">A-Z</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
};

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = api.category.getAll.useQuery();
  const { data: categoriesWithTopArticles, isLoading: isLoadingTopArticles } = api.category.getTopArticlesByCategory.useQuery();

  if (isLoading || isLoadingTopArticles) {
    return (
      <div className="flex min-h-screen bg-background">
        <SidebarProvider defaultOpen={true}>
          <CategorySidebar />
          <div className="flex-1 p-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <SidebarProvider defaultOpen={true}>
          <CategorySidebar />
          <div className="flex-1 p-8">
            <div className="text-center py-20">
              <h2 className="text-xl font-medium text-foreground mb-4">Error Loading Categories</h2>
              <p className="text-muted-foreground">
                There was an error loading the categories. Please try again later.
              </p>
            </div>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  // Group categories by main sections
  const categoriesWithArticles = categoriesWithTopArticles ?? [];

  const literatureCategories = categoriesWithArticles.filter(cat =>
    cat.name.toLowerCase().includes('literature') ||
    cat.name.toLowerCase().includes('philosophy') ||
    cat.name.toLowerCase().includes('poetry') ||
    cat.name.toLowerCase().includes('novel')
  );

  const artsCategories = categoriesWithArticles.filter(cat =>
    cat.name.toLowerCase().includes('art') ||
    cat.name.toLowerCase().includes('music') ||
    cat.name.toLowerCase().includes('film') ||
    cat.name.toLowerCase().includes('theater')
  );

  const historyCategories = categoriesWithArticles.filter(cat =>
    cat.name.toLowerCase().includes('history') ||
    cat.name.toLowerCase().includes('ancient') ||
    cat.name.toLowerCase().includes('medieval') ||
    cat.name.toLowerCase().includes('war')
  );

  const scienceCategories = categoriesWithArticles.filter(cat =>
    cat.name.toLowerCase().includes('science') ||
    cat.name.toLowerCase().includes('technology') ||
    cat.name.toLowerCase().includes('physics') ||
    cat.name.toLowerCase().includes('biology') ||
    cat.name.toLowerCase().includes('chemistry')
  );

  const otherCategories = categoriesWithArticles.filter(cat =>
    !literatureCategories.includes(cat) &&
    !artsCategories.includes(cat) &&
    !historyCategories.includes(cat) &&
    !scienceCategories.includes(cat)
  );

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <CategorySidebar />

        <div className="flex-1">
          {/* Mobile sidebar trigger */}
          <div className="fixed top-14 left-0 z-10 p-2 md:hidden">
            <SidebarTrigger className="border border-sidebar-border bg-sidebar text-sidebar-foreground" />
          </div>

          {/* Header with background image */}
          <div className="relative h-48 bg-gradient-to-r from-primary/80 to-primary flex items-center justify-center">
            <Image src="/category/banner.png" alt="Category banner" className="absolute inset-0 w-full h-full object-cover" width={1920} height={400} />
            <div className="relative text-center">
              <h1 className="text-4xl font-serif text-primary-foreground mb-2">Wikipedia Contents</h1>
            </div>
            {/* Decorative diamond */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="w-4 h-4 bg-sidebar-primary rotate-45"></div>
            </div>
          </div>

          <div className="p-8">
            {/* Literature & Philosophy Section */}
            {(literatureCategories.length > 0 || otherCategories.length > 0) && (
              <section className="mb-12">
                <SectionHeader title="Literature & Philosophy" />
                <div className="mb-4">
                  {literatureCategories.map((category) => (
                    <CategoryTag key={category.id} category={category} />
                  ))}
                  {literatureCategories.length === 0 && otherCategories.slice(0, 6).map((category) => (
                    <CategoryTag key={category.id} category={category} />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(literatureCategories.length > 0 ? literatureCategories : otherCategories).slice(0, 4).map((category) => (
                    <ContentCard key={category.id} category={category} />
                  ))}
                </div>
                {/* Show top articles for this section */}
                {literatureCategories.length > 0 && (
                  <ArticleList articles={literatureCategories.flatMap(cat => cat.topArticles).slice(0, 10)} section="literature" />
                )}
                {literatureCategories.length === 0 && otherCategories.length > 0 && (
                  <ArticleList articles={otherCategories.slice(0, 4).flatMap(cat => cat.topArticles).slice(0, 10)} section="literature" />
                )}
              </section>
            )}

            {/* Arts & Culture Section */}
            {(artsCategories.length > 0 || otherCategories.length > 4) && (
              <section className="mb-12">
                <SectionHeader title="Arts & Culture" />
                <div className="mb-4">
                  {artsCategories.map((category) => (
                    <CategoryTag key={category.id} category={category} />
                  ))}
                  {artsCategories.length === 0 && otherCategories.slice(4, 10).map((category) => (
                    <CategoryTag key={category.id} category={category} />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(artsCategories.length > 0 ? artsCategories : otherCategories.slice(4, 7)).slice(0, 3).map((category) => (
                    <ContentCard key={category.id} category={category} />
                  ))}
                </div>
                {/* Show top articles for this section */}
                {artsCategories.length > 0 && (
                  <ArticleList articles={artsCategories.flatMap(cat => cat.topArticles).slice(0, 10)} section="arts" />
                )}
                {artsCategories.length === 0 && otherCategories.length > 4 && (
                  <ArticleList articles={otherCategories.slice(4, 7).flatMap(cat => cat.topArticles).slice(0, 10)} section="arts" />
                )}
              </section>
            )}

            {/* History & Society Section */}
            {(historyCategories.length > 0 || otherCategories.length > 7) && (
              <section className="mb-12">
                <SectionHeader title="History & Society" />
                <div className="mb-4">
                  {historyCategories.map((category) => (
                    <CategoryTag key={category.id} category={category} />
                  ))}
                  {historyCategories.length === 0 && otherCategories.slice(7, 14).map((category) => (
                    <CategoryTag key={category.id} category={category} />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(historyCategories.length > 0 ? historyCategories : otherCategories.slice(7, 11)).slice(0, 4).map((category) => (
                    <ContentCard key={category.id} category={category} />
                  ))}
                </div>
                {/* Show top articles for this section */}
                {historyCategories.length > 0 && (
                  <ArticleList articles={historyCategories.flatMap(cat => cat.topArticles).slice(0, 10)} section="history" />
                )}
                {historyCategories.length === 0 && otherCategories.length > 7 && (
                  <ArticleList articles={otherCategories.slice(7, 11).flatMap(cat => cat.topArticles).slice(0, 10)} section="history" />
                )}
              </section>
            )}

            {/* Science & Technology Section */}
            {(scienceCategories.length > 0 || otherCategories.length > 11) && (
              <section className="mb-12">
                <SectionHeader title="Science & Technology" />
                <div className="mb-4">
                  {scienceCategories.map((category) => (
                    <CategoryTag key={category.id} category={category} />
                  ))}
                  {scienceCategories.length === 0 && otherCategories.slice(11).map((category) => (
                    <CategoryTag key={category.id} category={category} />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(scienceCategories.length > 0 ? scienceCategories : otherCategories.slice(11, 15)).slice(0, 4).map((category) => (
                    <ContentCard key={category.id} category={category} />
                  ))}
                </div>
                {/* Show top articles for this section */}
                {scienceCategories.length > 0 && (
                  <ArticleList articles={scienceCategories.flatMap(cat => cat.topArticles).slice(0, 10)} section="science" />
                )}
                {scienceCategories.length === 0 && otherCategories.length > 11 && (
                  <ArticleList articles={otherCategories.slice(11, 15).flatMap(cat => cat.topArticles).slice(0, 10)} section="science" />
                )}
              </section>
            )}

            {/* Empty state */}
            {!categories || categories.length === 0 && (
              <div className="text-center py-20">
                <Tag className="h-16 w-16 text-muted mx-auto mb-4" />
                <h2 className="text-xl font-medium text-foreground mb-4">No Categories Available</h2>
                <p className="text-muted-foreground">
                  Categories will appear here as they are created.
                </p>
              </div>
            )}
          </div>


        </div>
      </SidebarProvider>
    </div>
  );
} 
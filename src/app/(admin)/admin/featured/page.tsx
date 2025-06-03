"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Star, StarOff } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";

const featuredSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

type FeaturedFormData = z.infer<typeof featuredSchema>;

const defaultFormData: FeaturedFormData = {
  description: "",
};

export default function FeaturedArticlesPage() {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeaturedFormData>(defaultFormData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FeaturedFormData, string>>
  >({});

  const { data: articles, refetch } = api.article.getHomePageData.useQuery();
  const { mutate: setFeatured, isPending } =
    api.article.setFeatured.useMutation({
      onSuccess: () => {
        setFormData(defaultFormData);
        setSelectedArticle(null);
        void refetch();
        toast.success("Featured status updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  // Separate featured and trending articles
  const featuredArticles =
    articles?.trendingArticles.filter((article) => article.isFeatured) ?? [];
  const trendingArticles =
    articles?.trendingArticles.filter((article) => !article.isFeatured) ?? [];

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FeaturedFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const validatedData = featuredSchema.parse(formData);
      if (!selectedArticle) return;
      setFeatured({
        id: selectedArticle,
        featured: true,
        description: validatedData.description,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
    }
  };

  const handleUnfeature = (id: string) => {
    setFeatured({
      id,
      featured: false,
    });
  };

  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="mb-6 font-serif text-3xl">Manage Featured Articles</h1>

      {/* Featured Article Form */}
      {selectedArticle && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Set Featured Description</CardTitle>
            <CardDescription>
              Add a description explaining why this article is being featured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="featuredForm" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Featured Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full rounded-md border p-2 focus:border-[#6b4c35] focus:ring-[#6b4c35]"
                  placeholder="Enter a description for why this article is featured..."
                  rows={3}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="submit"
                form="featuredForm"
                disabled={isPending}
                className="bg-[#6b4c35] text-white hover:bg-[#8b6c55]"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set as Featured
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedArticle(null);
                  setFormData(defaultFormData);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Currently Featured Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#6b4c35]" />
            Currently Featured Articles
          </CardTitle>
          <CardDescription>
            Articles currently featured on the homepage (
            {featuredArticles.length} articles)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredArticles.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuredArticles.map((article) => (
                  <TableRow key={article.id} className="bg-blue-50">
                    <TableCell className="font-medium">
                      {article.title}
                    </TableCell>
                    <TableCell>{article.author.name}</TableCell>
                    <TableCell>{article.viewCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnfeature(article.id)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700"
                      >
                        <StarOff className="mr-1 h-4 w-4" />
                        Remove Featured
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <Star className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p>No articles are currently featured.</p>
              <p className="text-sm">
                Select articles from the trending list below to feature them.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Articles (Not Featured) */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Articles</CardTitle>
          <CardDescription>
            Popular articles that can be featured on the homepage (
            {trendingArticles.length} articles)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendingArticles.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trendingArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      {article.title}
                    </TableCell>
                    <TableCell>{article.author.name}</TableCell>
                    <TableCell>{article.viewCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedArticle(article.id)}
                        disabled={isPending}
                        className="text-[#6b4c35] hover:text-[#8b6c55]"
                      >
                        <Star className="mr-1 h-4 w-4" />
                        Set as Featured
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <p>No trending articles available to feature.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

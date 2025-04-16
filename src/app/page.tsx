import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col items-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to ModernWiki</h1>
        <p className="text-center text-muted-foreground">
          The free encyclopedia that anyone can edit
        </p>
        <div className="w-full max-w-2xl">
          <Input
            type="search"
            placeholder="Search ModernWiki"
            className="h-12 text-lg"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Featured Articles</CardTitle>
            <CardDescription>Selected articles of exceptional quality</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">
                  Quantum Computing
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">
                  Artificial Intelligence
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">
                  Climate Change
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Did You Know?</CardTitle>
            <CardDescription>Facts that you might not know</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">
                  The first computer mouse was made of wood
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">
                  The Internet was invented in 1969
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:underline dark:text-blue-400">
                  The first website is still online
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

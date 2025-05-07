"use client";

import Link from "next/link";
import { Header } from "./header";

interface RootLayoutProps {
  children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative w-full">{children}</main>
      {/* <footer className="border-t py-4">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <p className="text-muted-foreground text-xs">
              &copy; {new Date().getFullYear()} WikiClone
            </p>
            <nav>
              <ul className="flex gap-4">
                <li>
                  <Link href="/wiki" className="text-xs hover:underline">
                    Articles
                  </Link>
                </li>
                <li>
                  <Link href="/wiki/create" className="text-xs hover:underline">
                    Create Article
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </footer> */}
    </div>
  );
}

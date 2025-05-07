import "~/styles/globals.css";

import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/providers/theme-provider";
import { SessionProvider } from "~/components/providers/session-provider";
import { ToastProvider } from "~/components/providers/toast-provider";
import { Header } from "~/components/layout/header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Modern Wikipedia Clone",
  description: "A modern Wikipedia clone built with Next.js and shadcn/ui",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableColorScheme
          themes={["light", "dark", "pink"]}
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <TRPCReactProvider>
              <NextTopLoader />

              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="relative w-full">{children}</main>
              </div>

              <ToastProvider />
            </TRPCReactProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

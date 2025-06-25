import "~/styles/globals.css";

import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "~/components/providers/session-provider";
import { ToastProvider } from "~/components/providers/toast-provider";
import { Analytics } from "@vercel/analytics/next";
import { env } from "~/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Modern WikiClone",
  description: "A modern WikiClone built with Next.js and shadcn/ui",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable}`}>
        {env.NODE_ENV === "production" && env.VERCEL_ANALYTICS && <Analytics />}
        <SessionProvider>
          <TRPCReactProvider>
            <NextTopLoader />
            {children}
            <ToastProvider />
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

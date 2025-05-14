import "~/styles/globals.css";

import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "~/components/providers/session-provider";
import { ToastProvider } from "~/components/providers/toast-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Modern Wikipedia Clone",
  description: "A modern Wikipedia clone built with Next.js and shadcn/ui",
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

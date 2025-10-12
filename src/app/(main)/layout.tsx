import "~/styles/globals.css";
import { Header } from "~/components/layout/header";
import { Footer } from "~/components/layout/footer";
import { GameBanner } from "~/components/game/game-banner";

export const metadata = {
  title: "Modern WikiClone",
  description: "A modern WikiClone built with Next.js and shadcn/ui",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <GameBanner />
      <main className="w-full flex-1">{children}</main>
      <Footer />
    </div>
  );
}

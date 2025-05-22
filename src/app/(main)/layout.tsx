import "~/styles/globals.css";
import { Header } from "~/components/layout/header";
import { Footer } from "~/components/layout/footer";

export const metadata = {
  title: "Modern Wikipedia Clone",
  description: "A modern Wikipedia clone built with Next.js and shadcn/ui",
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
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Notes",
  description: "View your saved notes and AI summaries",
};

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-4">
      {children}
    </div>
  );
} 
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "~/components/ui/sidebar";
import { BookOpen } from "lucide-react";

interface WikiArticleContentsProps {
  sections?: string[];
  content?: string;
}

export function WikiArticleContents({
  sections = [],
  content = "",
}: WikiArticleContentsProps) {
  const { toggleSidebar } = useSidebar();

  // Default sections to show if no content is provided
  const defaultSections = [
    "Personal Information",
    "Introduction",
    "Early Life",
    "Career",
    "Contributions",
    "Legacy",
  ];

  // If content is provided, extract headings (lines starting with # in markdown)
  const extractedSections: { text: string; level: number; id: string }[] = [];

  if (content) {
    const lines = content.split("\n");

    for (const line of lines) {
      // Match heading patterns: #, ##, ###, etc.
      const headingRegex = /^(#{1,6})\s+(.+)$/;
      const match = headingRegex.exec(line);

      if (match && match.length >= 3) {
        const level = match[1]?.length ?? 1; // Number of # symbols indicates heading level
        const text = match[2]?.trim() ?? "";
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        extractedSections.push({ text, level, id });
      }
    }
  }

  // Use extracted sections if available, otherwise fall back to provided sections or defaults
  const displaySections =
    extractedSections.length > 0
      ? extractedSections
      : sections.length > 0
        ? sections.map((section) => ({
            text: section,
            level: 1,
            id: section.toLowerCase().replace(/\s+/g, "-"),
          }))
        : defaultSections.map((section) => ({
            text: section,
            level: 1,
            id: section.toLowerCase().replace(/\s+/g, "-"),
          }));

  const handleLinkClick = () => {
    // On mobile, close the sidebar after clicking a link
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setTimeout(() => toggleSidebar(), 100);
    }
  };

  return (
    <Sidebar className="border-r border-[#e5d3b3] bg-white">
      <SidebarHeader className="border-b border-[#e5d3b3]">
        <div className="flex items-center gap-2 text-[#4b2e13]">
          <BookOpen className="h-5 w-5" />
          <h3 className="font-medium">Contents</h3>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {displaySections.map((section, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton
                asChild
                className={`${
                  section.level > 1
                    ? `pl-${Math.min(section.level, 4) * 2 + 2}`
                    : ""
                } text-[#4b2e13] hover:bg-[#f9f5eb] hover:text-[#3a2a14]`}
              >
                <Link href={`#${section.id}`} onClick={handleLinkClick}>
                  {section.level > 1 && (
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#d4bc8b]"></span>
                  )}
                  <span>{section.text}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

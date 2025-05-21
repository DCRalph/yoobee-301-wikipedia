"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "~/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useEffect, useState } from "react";

interface WikiArticleContentsProps {
  sections?: string[];
  content?: string;
}

export function WikiArticleContents({
  sections = [],
  content = "",
}: WikiArticleContentsProps) {
  const { toggleSidebar } = useSidebar();
  const [activeSection, setActiveSection] = useState<string>("article-top");

  // Default sections if no content is provided
  const defaultSections = [
    "Introduction",
  ];

  // Extract headings from markdown content
  const extractedSections: { text: string; level: number; id: string }[] = [];
  if (content) {
    const lines = content.split("\n");
    const headingRegex = /^(#{1,6})\s+(.+)$/;
    for (const line of lines) {
      const match = headingRegex.exec(line);
      if (match && match.length >= 3) {
        const level = match[1]?.length ?? 1;
        const text = match[2]?.trim() ?? "";
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        extractedSections.push({ text, level, id });
      }
    }
  }

  // Determine display sections: extracted > provided > default
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

  // Set up intersection observer for section headings
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Filter currently intersecting entries
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length === 0) return;

        // Pick the entry with the highest intersectionRatio
        const mostVisibleEntry = visibleEntries.reduce((prev, current) =>
          current.intersectionRatio > prev.intersectionRatio ? current : prev
        );

        setActiveSection(mostVisibleEntry.target.id);
      },
      {
        // Adjust these values if necessary to control when the highlighting happens
        rootMargin: "-20% 0px -80% 0px",
        // threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe the "article-top" element
    const articleTop = document.getElementById("article-top");
    if (articleTop) {
      observer.observe(articleTop);
    }

    // Observe all section headings
    displaySections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [displaySections]);

  // Helper to compute left padding class based on heading level
  const getPaddingClass = (level: number) => {
    if (level <= 1) return "";
    // For level 2 show pl-6, level 3 => pl-8, level 4+ => pl-10
    if (level === 2) return "pl-6";
    if (level === 3) return "pl-8";
    return "pl-10";
  };

  // Close the sidebar on mobile after a link is clicked
  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setTimeout(() => toggleSidebar(), 100);
    }
  };

  return (
    <TooltipProvider>
      <Sidebar
        className="hidden md:block border-r border-[#e5d3b3] bg-white shadow-sm"
        variant="sidebar"
        collapsible="icon"
      >
        <SidebarHeader className="border-b md:mt-14 border-[#e5d3b3] p-3">
          <div className="flex items-center gap-2 text-[#4b2e13]">
            <BookOpen className="h-5 w-5" />
            <h3 className="text-sm font-medium">Contents</h3>
          </div>
        </SidebarHeader>
        <SidebarContent className="overflow-y-auto pb-16">
          <SidebarMenu className="p-2">
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    className={`${getPaddingClass(1)} text-sm ${activeSection === "article-top"
                      ? "bg-[#f9f5eb] text-[#3a2a14] font-medium"
                      : "text-[#4b2e13] hover:bg-[#f9f5eb] hover:text-[#3a2a14]"
                      } transition-colors duration-200`}
                    onClick={() => {
                      const href = window.location.href;
                      const noHash = href.split("#")[0];
                      window.history.replaceState({}, "", noHash);
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                      handleLinkClick();
                    }}
                  >
                    <span>Top</span>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Jump to top of article</p>
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            {displaySections.map((section, index) => (
              <SidebarMenuItem key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      className={`${getPaddingClass(section.level)} text-sm ${activeSection === section.id
                        ? "bg-[#f9f5eb] text-[#3a2a14] font-medium"
                        : "text-[#4b2e13] hover:bg-[#f9f5eb] hover:text-[#3a2a14]"
                        } transition-colors duration-200`}
                    >
                      <Link href={`#${section.id}`} onClick={handleLinkClick}>
                        {section.level > 1 && (
                          <div className="mr-2 h-2 w-2 aspect-square rounded-full bg-[#d4bc8b]" />
                        )}
                        <span>{section.text}</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Jump to {section.text}</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}

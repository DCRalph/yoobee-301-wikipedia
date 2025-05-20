import Link from "next/link"

interface WikiArticleContentsProps {
  sections?: string[]
}

export function WikiArticleContents({ sections = [] }: WikiArticleContentsProps) {
  const defaultSections = ["Personal Information", "Introduction", "Early Life", "Career", "Contributions", "Legacy"]

  const displaySections = sections.length > 0 ? sections : defaultSections

  return (
    <div className="sticky top-0 h-screen overflow-y-auto rounded-none border-r border-[#e5d3b3] bg-white shadow-sm">
      <div className="border-b border-[#e5d3b3] p-4">
        <h3 className="font-medium text-[#4b2e13]">Contents</h3>
      </div>
      <div className="p-4">
        <ul className="space-y-2 text-sm">
          {displaySections.map((section, index) => (
            <li key={index}>
              <Link href={`#${section.toLowerCase().replace(/\s+/g, "-")}`} className="text-[#4b2e13] hover:underline">
                {section}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

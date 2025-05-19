import Link from "next/link"

interface WikiArticleContentsProps {
  sections?: string[]
}

export function WikiArticleContents({ sections = [] }: WikiArticleContentsProps) {
  const defaultSections = ["Personal Information", "Introduction", "Early Life", "Career", "Contributions", "Legacy"]

  const displaySections = sections.length > 0 ? sections : defaultSections

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b p-4">
        <h3 className="font-medium">Contents</h3>
      </div>
      <div className="p-4">
        <ul className="space-y-2 text-sm">
          {displaySections.map((section, index) => (
            <li key={index}>
              <Link
                href={`#${section.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-gray-700 hover:text-blue-600"
              >
                {section}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

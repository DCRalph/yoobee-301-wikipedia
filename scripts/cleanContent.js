/**
 * Cleans content by removing summary blocks and header patterns
 * @param {string} content - The content to clean
 * @returns {string} - The cleaned content
 */
export const cleanContent = (content) => {
  // Pattern 1: :::summary::: followed by space and # (keep the title)
  content = content.replace(/^:::summary:::\s*\n\s*/, '')

  // Pattern 2: :::summary\n::: followed by # Title (keep the title)
  content = content.replace(/^:::summary\s*\n:::\s*\n/, '')

  // Pattern 3: :::summary\n:::  # (without space after #) - remove summary block AND title
  if (content.match(/^:::summary\s*\n:::\s*#\n/)) {
    content = content.replace(/^:::summary\s*\n:::\s*#\n[^\n]*\n/, '')
  }

  // Pattern 4: :::summary\n:::  # (with space after #) - remove summary block but keep title
  content = content.replace(/^:::summary\s*\n:::\s*#\s+\n/, '')

  // Remove lines that are just "# " (hash followed by space/whitespace, then newline)
  content = content.replace(/^#\s+\n/, '')

  // Remove standalone "  # " lines (indented hash with space)
  content = content.replace(/^\s*#\s*\n/, '')

  // Clean up leading whitespace from remaining lines
  content = content.replace(/^\s+/gm, '')

  // Trim trailing spaces from non-header lines (lines that don't start with #)
  content = content.replace(/^([^#\n].*?)\s+$/gm, '$1')

  return content
}

export default cleanContent

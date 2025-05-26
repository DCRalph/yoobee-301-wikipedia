import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { slugify } from "~/lib/utils";

// API key validation
const API_KEY = "hello";

// Define the schema for article creation
const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

/**
 * Extracts summary from the article content.
 * If the content starts with a summary block (delimited by ":::summary" and ":::"),
 * it returns an object with the summary content (without the start/end markers)
 * and the remaining content. Otherwise, summary is null.
 *
 * @param content The full article content.
 * @returns An object with the extracted summary and the remaining content.
 */
function extractSummaryAndContent(content: string): {
  summary: string | null;
  content: string;
} {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== ":::summary") {
    return { summary: null, content };
  }

  // console.log("lines", lines);

  const summaryLines: string[] = [];
  let i = 1;
  // Extract the summary lines until we hit the closing marker.
  for (; i < lines.length; i++) {
    if (lines[i]?.trim() === ":::") {
      break;
    }
    summaryLines.push(lines[i] ?? "");
  }

  // console.log("summaryLines", summaryLines);
  // Combine summary lines (ignore the markers)
  const summaryBlock = summaryLines.join("\n").trim();
  // The remaining content starts after the closing marker
  const remainingContent = lines
    .slice(i + 1)
    .join("\n")
    .trim();

  // console.log("summaryBlock", summaryBlock);

  return { summary: summaryBlock, content: remainingContent };
}

/**
 * Parses a markdown summary block into a key/value pair object.
 * The expected format on each line is "**Key:** Value".
 *
 * @param summary The summary markdown string.
 * @returns An object mapping keys to values.
 */
function parseSummary(summary: string): Record<string, string> {
  const lines = summary.split("\n");
  const keyValuePairs: Record<string, string> = {};

  // Regular expression to capture the key and value.
  // It matches lines that start with **, followed by the key, then **: and the value.
  const keyValueRegex = /^\*\*(.+?)\*\*\s*(.*)$/;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const match = keyValueRegex.exec(trimmedLine);

    // console.log("match", match, trimmedLine);

    if (match) {
      let key = match[1]?.trim();
      // Remove a trailing colon if it exists
      if (key?.endsWith(":")) {
        key = key.slice(0, -1).trim();
      }
      const value = match[2]?.trim();
      if (key && value) {
        keyValuePairs[key] = value;
      }
    }
  });

  return keyValuePairs;
}

export async function POST(req: NextRequest) {
  // Validate API key
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid API key" },
      { status: 401 },
    );
  }

  try {
    // Parse request body
    const body = (await req.json()) as unknown;

    // Validate with zod
    const validationResult = articleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const title = validationResult.data.title;
    let content = validationResult.data.content;

    // If content starts with a summary block, extract and parse it.
    const { summary, content: newContent } = extractSummaryAndContent(content);
    if (summary) {
      const parsedSummary = parseSummary(summary);
      console.log("Parsed Summary:", parsedSummary);
      // Optionally: you can store parsedSummary in the database (e.g. in quickFacts)
      // For now, we update the content to exclude the summary block.
      content = newContent;
    }

    // Generate slug from title
    const slug = slugify(title);

    // Check if an article with this slug already exists
    const existingArticle = await db.article.findUnique({
      where: { slug },
    });
    if (existingArticle) {
      return NextResponse.json(
        { error: "An article with this title already exists" },
        { status: 409 },
      );
    }

    // Create new article
    const article = await db.article.create({
      data: {
        title,
        content,
        slug,
        approved: true,
        needsApproval: false,
        approvedAt: new Date(),
        approvedBy: "cmb50c2pc0000ocvwtyy4bxcu",
        published: true,
        // Set the first user as author (adjust based on your needs)
        authorId: "cmb50c2pc0000ocvwtyy4bxcu",
        quickFacts: summary ? parseSummary(summary) : {},
      },
    });

    // return NextResponse.json({ success: true, article }, { status: 201 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    console.log(await req.text());
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 },
    );
  }
}

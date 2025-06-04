import { db } from "~/server/db";
import {
  pipeline,
  type FeatureExtractionPipelineType,
} from "@xenova/transformers";

// Types
interface VectorSearchResult {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  slug: string;
  published: boolean;
  approved: boolean;
  needsApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
  distance: number;
  similarity: number;
  titleDistance?: number;
  contentDistance?: number;
  viewCount?: number;
  dailyViews?: number;
}

interface VectorStats {
  totalArticles: number;
  articlesWithTitleVectors: number;
  articlesWithContentVectors: number;
  articlesWithBothVectors: number;
}

interface VectorSearchResponse {
  results: VectorSearchResult[];
  totalFound: number;
  executionTime: number;
  searchType: "title" | "content" | "hybrid";
  stats: VectorStats;
  page: number;
  itemsPerPage: number;
  totalPages: number;
}

interface VectorSearchOptions {
  searchTerm: string;
  itemsPerPage?: number;
  searchType?: "title" | "content" | "hybrid";
  page?: number;
  maxDistance?: number;
  maxQueryLimit?: number;
  titleWeight?: number;
  contentWeight?: number;
}

// Database query result types
interface DatabaseQueryResult {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  slug: string;
  published: boolean;
  approved: boolean;
  needsApproval: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  distance: number | string;
  title_distance?: number | string;
  content_distance?: number | string;
  viewCount?: number;
  dailyViews?: number;
}

interface SourceArticleQueryResult {
  titleVector?: string;
  contentVector?: string;
}

// Singletons
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
let embedder: FeatureExtractionPipelineType | null = null;
const embeddingCache = new Map<string, number[]>();
const CACHE_MAX_SIZE = 1000;

// Vector stats cache
let vectorStatsCache: { stats: VectorStats; timestamp: number } | null = null;
const STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

async function getEmbedder() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  embedder ??= await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return embedder;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (embeddingCache.has(cleanText)) {
    return embeddingCache.get(cleanText)!;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const model = await getEmbedder();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const embedding = await model(cleanText, {
    pooling: "mean",
    normalize: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  const result = Array.from(embedding.data) as number[];

  // Manage cache size
  if (embeddingCache.size >= CACHE_MAX_SIZE) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey !== undefined) {
      embeddingCache.delete(firstKey);
    }
  }
  embeddingCache.set(cleanText, result);

  return result;
}

async function getVectorStats(): Promise<VectorStats> {
  // Check cache first
  if (vectorStatsCache) {
    const now = Date.now();
    const cacheAge = now - vectorStatsCache.timestamp;

    if (cacheAge < STATS_CACHE_DURATION) {
      return vectorStatsCache.stats;
    }
  }

  // Cache miss or expired, fetch from database
  const stats = await db.$queryRaw<
    [
      {
        total_articles: bigint;
        articles_with_title_vectors: bigint;
        articles_with_content_vectors: bigint;
        articles_with_both_vectors: bigint;
      },
    ]
  >`
    SELECT 
      COUNT(*) as total_articles,
      COUNT("titleVector") as articles_with_title_vectors,
      COUNT("contentVector") as articles_with_content_vectors,
      COUNT(CASE WHEN "titleVector" IS NOT NULL AND "contentVector" IS NOT NULL THEN 1 END) as articles_with_both_vectors
    FROM "Article"
    WHERE published = true AND approved = true AND "needsApproval" = false
  `;

  const row = stats[0];
  const result = {
    totalArticles: Number(row?.total_articles ?? 0),
    articlesWithTitleVectors: Number(row?.articles_with_title_vectors ?? 0),
    articlesWithContentVectors: Number(row?.articles_with_content_vectors ?? 0),
    articlesWithBothVectors: Number(row?.articles_with_both_vectors ?? 0),
  };

  // Update cache
  vectorStatsCache = {
    stats: result,
    timestamp: Date.now(),
  };

  return result;
}

export async function vectorSearch(
  options: VectorSearchOptions,
): Promise<VectorSearchResponse> {
  const startTime = Date.now();

  const {
    searchTerm,
    itemsPerPage = 10,
    searchType = "title",
    page = 1,
    maxDistance = 1.0,
    maxQueryLimit = 100,
    titleWeight = 0.3,
    contentWeight = 0.7,
  } = options;

  // Generate embedding
  const queryVector = await generateEmbedding(searchTerm);
  const vectorString = `[${queryVector.join(",")}]`;

  // Calculate pagination
  const offset = (page - 1) * itemsPerPage;
  const actualLimit = Math.min(itemsPerPage, maxQueryLimit);
  // const actualLimit = maxQueryLimit;
  // Get stats in parallel
  const statsPromise = getVectorStats();
  // const statsPromise = new Promise<VectorStats>((resolve) => {
  //   resolve({
  //     totalArticles: 0,
  //     articlesWithTitleVectors: 0,
  //     articlesWithContentVectors: 0,
  //     articlesWithBothVectors: 0,
  //   });
  // });

  let results: DatabaseQueryResult[] = [];
  let totalFound = 0;

  console.log("searchType", searchType);
  console.log("itemsPerPage", itemsPerPage);
  console.log("page", page);
  console.log("maxDistance", maxDistance);
  console.log("maxQueryLimit", maxQueryLimit);
  console.log("titleWeight", titleWeight);
  console.log("contentWeight", contentWeight);
  console.log("actualLimit", actualLimit);
  console.log("offset", offset);

  // Execute search based on type
  switch (searchType) {
    case "title":
      // Get total count
      // const titleCountResult = await db.$queryRaw<[{ count: bigint }]>`
      //   SELECT COUNT(*) as count
      //   FROM "Article"
      //   WHERE "titleVector" IS NOT NULL
      //     AND published = true
      //     AND approved = true
      //     AND "needsApproval" = false
      //     AND ("titleVector" <=> ${vectorString}::vector) <= ${maxDistance}
      // `;
      // totalFound = Number(titleCountResult[0]?.count ?? 0);
      totalFound = maxQueryLimit;

      console.log("totalFound", totalFound);

      // Get results
      results = await db.$queryRaw<DatabaseQueryResult[]>`
        SELECT 
          "Article".id, "Article".title, 
          "Article".content,
          "Article"."authorId", "User".name as "authorName", "Article".slug, "Article".published, "Article".approved, "Article"."needsApproval",
          "Article"."createdAt", "Article"."updatedAt", "Article"."viewCount", "Article"."dailyViews",
          ("Article"."titleVector" <=> ${vectorString}::vector) as distance
        FROM "Article" 
        JOIN "User" ON "Article"."authorId" = "User"."id"
        WHERE "Article"."titleVector" IS NOT NULL
          AND "Article".published = true 
          AND "Article".approved = true 
          AND "Article"."needsApproval" = false
          AND ("Article"."titleVector" <=> ${vectorString}::vector) <= ${maxDistance}
        ORDER BY ("Article"."titleVector" <=> ${vectorString}::vector)
        LIMIT ${actualLimit}
        OFFSET ${offset}
      `;
      break;

    case "content":
      // Get total count
      const contentCountResult = await db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM "Article" 
        WHERE "contentVector" IS NOT NULL 
          AND published = true 
          AND approved = true 
          AND "needsApproval" = false
          AND ("contentVector" <=> ${vectorString}::vector) <= ${maxDistance}
      `;
      totalFound = Number(contentCountResult[0]?.count ?? 0);

      console.log("totalFound", totalFound);

      // Get results
      results = await db.$queryRaw<DatabaseQueryResult[]>`
        SELECT 
          "Article".id, "Article".title,
          CASE WHEN LENGTH("Article".content) > 500 THEN LEFT("Article".content, 500) || '...' ELSE "Article".content END as content,
          "Article"."authorId", "User".name as "authorName", "Article".slug, "Article".published, "Article".approved, "Article"."needsApproval",
          "Article"."createdAt", "Article"."updatedAt", "Article"."viewCount", "Article"."dailyViews",
          ("Article"."contentVector" <=> ${vectorString}::vector) as distance
        FROM "Article" 
        JOIN "User" ON "Article"."authorId" = "User"."id"
        WHERE "Article"."contentVector" IS NOT NULL 
          AND "Article".published = true 
          AND "Article".approved = true 
          AND "Article"."needsApproval" = false
          AND ("Article"."contentVector" <=> ${vectorString}::vector) <= ${maxDistance}
        ORDER BY ("Article"."contentVector" <=> ${vectorString}::vector)
        LIMIT ${actualLimit}
        OFFSET ${offset}
      `;
      break;

    case "hybrid":
    default:
      // Get total count
      const hybridCountResult = await db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM "Article" 
        WHERE "titleVector" IS NOT NULL 
          AND "contentVector" IS NOT NULL 
          AND published = true 
          AND approved = true 
          AND "needsApproval" = false
          AND (("titleVector" <=> ${vectorString}::vector) * ${titleWeight} + 
               ("contentVector" <=> ${vectorString}::vector) * ${contentWeight}) <= ${maxDistance}
      `;
      totalFound = Number(hybridCountResult[0]?.count ?? 0);

      console.log("totalFound", totalFound);

      // Get results
      results = await db.$queryRaw<DatabaseQueryResult[]>`
        SELECT 
          "Article".id, "Article".title,
          CASE WHEN LENGTH("Article".content) > 500 THEN LEFT("Article".content, 500) || '...' ELSE "Article".content END as content,
          "Article"."authorId", "User".name as "authorName", "Article".slug, "Article".published, "Article".approved, "Article"."needsApproval",
          "Article"."createdAt", "Article"."updatedAt", "Article"."viewCount", "Article"."dailyViews",
          (("Article"."titleVector" <=> ${vectorString}::vector) * ${titleWeight} + ("Article"."contentVector" <=> ${vectorString}::vector) * ${contentWeight}) as distance,
          ("Article"."titleVector" <=> ${vectorString}::vector) as title_distance,
          ("Article"."contentVector" <=> ${vectorString}::vector) as content_distance
        FROM "Article" 
        JOIN "User" ON "Article"."authorId" = "User"."id"
        WHERE "Article"."titleVector" IS NOT NULL 
          AND "Article"."contentVector" IS NOT NULL 
          AND "Article".published = true 
          AND "Article".approved = true 
          AND "Article"."needsApproval" = false
          AND (("Article"."titleVector" <=> ${vectorString}::vector) * ${titleWeight} + 
               ("Article"."contentVector" <=> ${vectorString}::vector) * ${contentWeight}) <= ${maxDistance}
        ORDER BY distance
        LIMIT ${actualLimit}
        OFFSET ${offset}
      `;
      break;
  }

  // Wait for stats
  const stats = await statsPromise;
  const executionTime = Date.now() - startTime;

  // Transform results
  const transformedResults: VectorSearchResult[] = results.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    author: {
      id: row.authorId,
      name: row.authorName,
    },
    slug: row.slug,
    published: row.published,
    approved: row.approved,
    needsApproval: row.needsApproval,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    distance: parseFloat(String(row.distance)),
    similarity: 1 - parseFloat(String(row.distance)),
    titleDistance: row.title_distance
      ? parseFloat(String(row.title_distance))
      : undefined,
    contentDistance: row.content_distance
      ? parseFloat(String(row.content_distance))
      : undefined,
    viewCount: row.viewCount,
    dailyViews: row.dailyViews,
  }));

  const totalPages = Math.ceil(totalFound / itemsPerPage);

  return {
    results: transformedResults,
    totalFound,
    executionTime,
    searchType,
    stats,
    page,
    itemsPerPage,
    totalPages,
  };
}

export async function findSimilarArticles(
  articleId: string,
  itemsPerPage = 5,
  maxDistance = 1.0,
  searchType: "title" | "content" | "hybrid" = "title",
  titleWeight = 0.3,
  contentWeight = 0.7,
): Promise<VectorSearchResponse> {
  const startTime = Date.now();

  // Get source article vectors based on search type
  let sourceResult: SourceArticleQueryResult[] = [];

  if (searchType === "title") {
    sourceResult = await db.$queryRaw<SourceArticleQueryResult[]>`
      SELECT "titleVector"::text as "titleVector"
      FROM "Article" 
      WHERE id = ${articleId} 
        AND "titleVector" IS NOT NULL
    `;
  } else if (searchType === "content") {
    sourceResult = await db.$queryRaw<SourceArticleQueryResult[]>`
      SELECT "contentVector"::text as "contentVector"
      FROM "Article" 
      WHERE id = ${articleId} 
        AND "contentVector" IS NOT NULL
    `;
  } else {
    // hybrid mode
    sourceResult = await db.$queryRaw<SourceArticleQueryResult[]>`
      SELECT "titleVector"::text as "titleVector", "contentVector"::text as "contentVector"
      FROM "Article" 
      WHERE id = ${articleId} 
        AND "titleVector" IS NOT NULL 
        AND "contentVector" IS NOT NULL
    `;
  }

  if (sourceResult.length === 0) {
    const stats = await getVectorStats();
    return {
      results: [],
      totalFound: 0,
      executionTime: Date.now() - startTime,
      searchType,
      stats,
      page: 1,
      itemsPerPage,
      totalPages: 0,
    };
  }

  const sourceArticle = sourceResult[0];
  if (!sourceArticle) {
    const stats = await getVectorStats();
    return {
      results: [],
      totalFound: 0,
      executionTime: Date.now() - startTime,
      searchType,
      stats,
      page: 1,
      itemsPerPage,
      totalPages: 0,
    };
  }

  // Parse the vector strings and create vector query strings
  let titleVectorString = "";
  let contentVectorString = "";

  if (sourceArticle.titleVector) {
    const titleVector = JSON.parse(sourceArticle.titleVector) as number[];
    titleVectorString = `[${titleVector.join(",")}]`;
  }

  if (sourceArticle.contentVector) {
    const contentVector = JSON.parse(sourceArticle.contentVector) as number[];
    contentVectorString = `[${contentVector.join(",")}]`;
  }

  console.log("article has vector and am now searching");
  console.log("type", searchType);

  // Find similar articles based on search type
  let results: DatabaseQueryResult[] = [];

  if (searchType === "title") {
    results = await db.$queryRaw<DatabaseQueryResult[]>`
      SELECT 
        "Article".id, "Article".title,
        "Article".content,
        "Article"."authorId", "User".name as "authorName", "Article".slug, "Article".published, "Article".approved, "Article"."needsApproval",
        "Article"."createdAt", "Article"."updatedAt", "Article"."viewCount", "Article"."dailyViews",
        ("Article"."titleVector" <=> ${titleVectorString}::vector) as distance,
        ("Article"."titleVector" <=> ${titleVectorString}::vector) as title_distance
      FROM "Article" 
      JOIN "User" ON "Article"."authorId" = "User"."id"
      WHERE "Article".id != ${articleId}
        AND "Article".published = true 
        AND "Article".approved = true 
        AND "Article"."needsApproval" = false
        AND "Article"."titleVector" IS NOT NULL
        AND ("Article"."titleVector" <=> ${titleVectorString}::vector) <= ${maxDistance}
      ORDER BY ("Article"."titleVector" <=> ${titleVectorString}::vector)
      LIMIT ${itemsPerPage}
    `;
  } else if (searchType === "content") {
    results = await db.$queryRaw<DatabaseQueryResult[]>`
      SELECT 
        "Article".id, "Article".title,
        CASE WHEN LENGTH("Article".content) > 500 THEN LEFT("Article".content, 500) || '...' ELSE "Article".content END as content,
        "Article"."authorId", "User".name as "authorName", "Article".slug, "Article".published, "Article".approved, "Article"."needsApproval",
        "Article"."createdAt", "Article"."updatedAt", "Article"."viewCount", "Article"."dailyViews",
        ("Article"."contentVector" <=> ${contentVectorString}::vector) as distance,
        ("Article"."contentVector" <=> ${contentVectorString}::vector) as content_distance
      FROM "Article" 
      JOIN "User" ON "Article"."authorId" = "User"."id"
      WHERE "Article".id != ${articleId}
        AND "Article".published = true 
        AND "Article".approved = true 
        AND "Article"."needsApproval" = false
        AND "Article"."contentVector" IS NOT NULL
        AND ("Article"."contentVector" <=> ${contentVectorString}::vector) <= ${maxDistance}
      ORDER BY distance
      LIMIT ${itemsPerPage}
    `;
  } else {
    // hybrid mode
    results = await db.$queryRaw<DatabaseQueryResult[]>`
      SELECT 
        "Article".id, "Article".title,
        CASE WHEN LENGTH("Article".content) > 500 THEN LEFT("Article".content, 500) || '...' ELSE "Article".content END as content,
        "Article"."authorId", "User".name as "authorName", "Article".slug, "Article".published, "Article".approved, "Article"."needsApproval",
        "Article"."createdAt", "Article"."updatedAt", "Article"."viewCount", "Article"."dailyViews",
        (("Article"."titleVector" <=> ${titleVectorString}::vector) * ${titleWeight} + ("Article"."contentVector" <=> ${contentVectorString}::vector) * ${contentWeight}) as distance,
        ("Article"."titleVector" <=> ${titleVectorString}::vector) as title_distance,
        ("Article"."contentVector" <=> ${contentVectorString}::vector) as content_distance
      FROM "Article" 
      JOIN "User" ON "Article"."authorId" = "User"."id"
      WHERE "Article".id != ${articleId}
        AND "Article".published = true 
        AND "Article".approved = true 
        AND "Article"."needsApproval" = false
        AND "Article"."titleVector" IS NOT NULL
        AND "Article"."contentVector" IS NOT NULL
        AND (("Article"."titleVector" <=> ${titleVectorString}::vector) * ${titleWeight} + ("Article"."contentVector" <=> ${contentVectorString}::vector) * ${contentWeight}) <= ${maxDistance}
      ORDER BY distance
      LIMIT ${itemsPerPage}
    `;
  }

  const stats = await getVectorStats();
  const executionTime = Date.now() - startTime;

  const transformedResults: VectorSearchResult[] = results.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    author: {
      id: row.authorId,
      name: row.authorName,
    },
    slug: row.slug,
    published: row.published,
    approved: row.approved,
    needsApproval: row.needsApproval,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    distance: parseFloat(String(row.distance)),
    similarity: 1 - parseFloat(String(row.distance)),
    titleDistance: row.title_distance
      ? parseFloat(String(row.title_distance))
      : undefined,
    contentDistance: row.content_distance
      ? parseFloat(String(row.content_distance))
      : undefined,
    viewCount: row.viewCount,
    dailyViews: row.dailyViews,
  }));

  return {
    results: transformedResults,
    totalFound: transformedResults.length,
    executionTime,
    searchType,
    stats,
    page: 1,
    itemsPerPage,
    totalPages: 1,
  };
}

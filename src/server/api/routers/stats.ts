import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "~/server/db";

export const statsRouter = createTRPCRouter({
  getDatabaseSize: publicProcedure.query(async () => {
    try {
      // Get the current database name
      const currentDbQuery = await db.$queryRaw<[{ current_database: string }]>`
        SELECT current_database()
      `;

      const dbName = currentDbQuery[0]?.current_database;

      if (!dbName) {
        throw new Error("Could not determine database name");
      }

      // Query to get the database size in bytes
      const sizeQuery = await db.$queryRaw<[{ size_bytes: bigint }]>`
        SELECT pg_database_size(${dbName}) as size_bytes
      `;

      const sizeBytes = Number(sizeQuery[0]?.size_bytes || 0);

      // Convert bytes to MB (1 MB = 1024 * 1024 bytes)
      const sizeMB = Number((sizeBytes / (1024 * 1024)).toFixed(2));

      // Query to get article count
      const articleCountQuery = await db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "Article"
      `;

      const articleCount = Number(articleCountQuery[0]?.count || 0);

      return {
        totalSizeMB: sizeMB,
        totalSizeBytes: sizeBytes,
        formattedSize: sizeMB < 1
          ? `${(sizeMB * 1024).toFixed(1)} KB`
          : sizeMB < 1024
            ? `${sizeMB.toFixed(1)} MB`
            : `${(sizeMB / 1024).toFixed(2)} GB`,
        lastUpdated: new Date().toISOString(),
        articleCount: articleCount,
      };
    } catch (error) {
      console.error("Error getting database size:", error);

      // Fallback: return mock data if database query fails
      return {
        totalSizeMB: 0,
        totalSizeBytes: 0,
        formattedSize: "Unable to determine",
        lastUpdated: new Date().toISOString(),
        articleCount: 0,
        error: "Could not retrieve database statistics",
      };
    }
  }),
}); 
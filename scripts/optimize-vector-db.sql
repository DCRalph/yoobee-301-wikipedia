-- Vector Database Optimization Script for 6.4M+ Articles
-- This script creates optimized indexes and settings for fast vector search

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Set optimal PostgreSQL settings for vector operations
-- These settings optimize for vector search performance on large datasets

-- Increase work_mem for vector operations (adjust based on available RAM)
SET work_mem = '256MB';

-- Increase maintenance_work_mem for index creation
SET maintenance_work_mem = '2GB';

-- Increase max_parallel_workers_per_gather for parallel index creation
SET max_parallel_workers_per_gather = 4;

-- Enable parallel index creation
SET max_parallel_maintenance_workers = 4;

-- Optimize for vector operations
SET random_page_cost = 1.1;
SET effective_cache_size = '4GB';

-- Create HNSW indexes for fast approximate nearest neighbor search
-- These indexes provide excellent performance for large datasets (6M+ rows)

-- Drop existing indexes if they exist (for recreation)
DROP INDEX IF EXISTS idx_article_title_vector_hnsw;
DROP INDEX IF EXISTS idx_article_content_vector_hnsw;
DROP INDEX IF EXISTS idx_article_vector_composite;

-- Create HNSW index for title vectors
-- m=16: number of bi-directional links for each node (higher = better recall, slower build)
-- ef_construction=64: size of dynamic candidate list (higher = better quality, slower build)
CREATE INDEX CONCURRENTLY idx_article_title_vector_hnsw 
ON "Article" USING hnsw ("titleVector" vector_cosine_ops) 
WITH (m = 16, ef_construction = 64)
WHERE "titleVector" IS NOT NULL 
  AND published = true 
  AND approved = true 
  AND "needsApproval" = false;

-- Create HNSW index for content vectors
CREATE INDEX CONCURRENTLY idx_article_content_vector_hnsw 
ON "Article" USING hnsw ("contentVector" vector_cosine_ops) 
WITH (m = 16, ef_construction = 64)
WHERE "contentVector" IS NOT NULL 
  AND published = true 
  AND approved = true 
  AND "needsApproval" = false;

-- Create composite index for filtering + vector search optimization
-- This helps with the WHERE clauses in our queries
CREATE INDEX CONCURRENTLY idx_article_vector_composite
ON "Article" (published, approved, "needsApproval", "viewCount" DESC, "dailyViews" DESC)
WHERE "titleVector" IS NOT NULL 
  AND "contentVector" IS NOT NULL 
  AND published = true 
  AND approved = true 
  AND "needsApproval" = false;

-- Create partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY idx_article_published_vectors
ON "Article" ("createdAt" DESC, "updatedAt" DESC)
WHERE published = true 
  AND approved = true 
  AND "needsApproval" = false
  AND "titleVector" IS NOT NULL 
  AND "contentVector" IS NOT NULL;

-- Create index for vector generation tracking
CREATE INDEX CONCURRENTLY idx_article_vectors_generated_at
ON "Article" ("vectorsGeneratedAt" DESC)
WHERE "vectorsGeneratedAt" IS NOT NULL;

-- Optimize existing indexes for vector search queries
-- These complement the vector indexes for hybrid queries

-- Ensure we have optimal indexes for the filtering conditions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_status_optimized
ON "Article" (published, approved, "needsApproval", "viewCount" DESC)
WHERE published = true AND approved = true AND "needsApproval" = false;

-- Create index for similar article queries (excluding self)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_similarity_lookup
ON "Article" (id, published, approved, "needsApproval")
WHERE "titleVector" IS NOT NULL AND "contentVector" IS NOT NULL;

-- Update table statistics for better query planning
ANALYZE "Article";

-- Set optimal HNSW search parameters for runtime
-- These can be adjusted per query for speed vs accuracy tradeoff
-- ef_search: size of dynamic candidate list during search
-- Lower values = faster search, higher values = better recall

-- For fast searches (good for real-time user queries)
-- SET hnsw.ef_search = 40;

-- For high-quality searches (good for batch operations)
-- SET hnsw.ef_search = 100;

-- For maximum quality searches (good for research/analysis)
-- SET hnsw.ef_search = 200;

-- Create a function to optimize vector search settings
CREATE OR REPLACE FUNCTION optimize_vector_search_settings(search_quality TEXT DEFAULT 'balanced')
RETURNS void AS $$
BEGIN
  CASE search_quality
    WHEN 'fast' THEN
      PERFORM set_config('hnsw.ef_search', '40', false);
      PERFORM set_config('work_mem', '128MB', false);
    WHEN 'balanced' THEN
      PERFORM set_config('hnsw.ef_search', '100', false);
      PERFORM set_config('work_mem', '256MB', false);
    WHEN 'quality' THEN
      PERFORM set_config('hnsw.ef_search', '200', false);
      PERFORM set_config('work_mem', '512MB', false);
    ELSE
      RAISE EXCEPTION 'Invalid search_quality. Use: fast, balanced, or quality';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check vector index health
CREATE OR REPLACE FUNCTION check_vector_index_health()
RETURNS TABLE(
  index_name TEXT,
  table_name TEXT,
  index_size TEXT,
  estimated_rows BIGINT,
  last_analyzed TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.indexname::TEXT,
    i.tablename::TEXT,
    pg_size_pretty(pg_relation_size(i.indexname::regclass))::TEXT,
    c.reltuples::BIGINT,
    s.last_analyze
  FROM pg_indexes i
  JOIN pg_class c ON c.relname = i.indexname
  LEFT JOIN pg_stat_user_tables s ON s.relname = i.tablename
  WHERE i.tablename = 'Article' 
    AND (i.indexname LIKE '%vector%' OR i.indexname LIKE '%hnsw%')
  ORDER BY pg_relation_size(i.indexname::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get vector search performance stats
CREATE OR REPLACE FUNCTION get_vector_search_stats()
RETURNS TABLE(
  total_articles BIGINT,
  articles_with_title_vectors BIGINT,
  articles_with_content_vectors BIGINT,
  articles_with_both_vectors BIGINT,
  vector_coverage_percent NUMERIC,
  avg_title_vector_size NUMERIC,
  avg_content_vector_size NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_articles,
    COUNT("titleVector")::BIGINT as articles_with_title_vectors,
    COUNT("contentVector")::BIGINT as articles_with_content_vectors,
    COUNT(CASE WHEN "titleVector" IS NOT NULL AND "contentVector" IS NOT NULL THEN 1 END)::BIGINT as articles_with_both_vectors,
    ROUND(
      (COUNT(CASE WHEN "titleVector" IS NOT NULL AND "contentVector" IS NOT NULL THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC) * 100, 2
    ) as vector_coverage_percent,
    AVG(array_length("titleVector", 1))::NUMERIC as avg_title_vector_size,
    AVG(array_length("contentVector", 1))::NUMERIC as avg_content_vector_size
  FROM "Article"
  WHERE published = true AND approved = true AND "needsApproval" = false;
END;
$$ LANGUAGE plpgsql;

-- Set default search quality to balanced
SELECT optimize_vector_search_settings('balanced');

-- Display optimization results
SELECT 'Vector database optimization completed!' as status;
SELECT * FROM check_vector_index_health();
SELECT * FROM get_vector_search_stats();

-- Recommendations for runtime optimization:
/*
RUNTIME OPTIMIZATION RECOMMENDATIONS:

1. Connection Pooling:
   - Use PgBouncer or similar for connection pooling
   - Set pool size based on your concurrent user load

2. Memory Settings (adjust based on your server):
   - shared_buffers = 25% of RAM
   - effective_cache_size = 75% of RAM
   - work_mem = 256MB (for vector operations)
   - maintenance_work_mem = 2GB

3. Vector Search Quality vs Speed:
   - Fast searches: ef_search = 40 (sub-second response)
   - Balanced: ef_search = 100 (good quality, ~1-2 seconds)
   - High quality: ef_search = 200 (best results, 2-5 seconds)

4. Query Optimization:
   - Always include WHERE clauses to filter before vector search
   - Use LIMIT to restrict result sets
   - Consider using approximate search for real-time queries

5. Monitoring:
   - Monitor index usage with pg_stat_user_indexes
   - Track query performance with pg_stat_statements
   - Use EXPLAIN ANALYZE for query optimization

6. Maintenance:
   - Run VACUUM and ANALYZE regularly
   - Monitor index bloat
   - Consider REINDEX if performance degrades
*/ 
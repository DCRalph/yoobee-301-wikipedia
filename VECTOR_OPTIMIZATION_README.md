# Vector Search Performance Optimization Guide

## 🚀 Overview

This guide provides comprehensive optimizations for your Wikipedia-like application's vector search functionality, specifically designed to handle **6.4 million+ articles** efficiently.

## 📊 Performance Improvements

After optimization, you can expect:

- **10-100x faster** vector searches
- **Sub-second response times** for most queries
- **Efficient memory usage** with connection pooling
- **Scalable architecture** for millions of articles

## 🔧 Quick Start

### 1. Run Database Optimization

```bash
# Create optimized HNSW indexes and database settings
npm run vectors:optimize
```

This will:

- Create HNSW indexes for title and content vectors
- Set up composite indexes for filtering
- Configure optimal PostgreSQL settings
- Create monitoring functions

### 2. Check Optimization Health

```bash
# Verify indexes and get performance statistics
npm run vectors:health
```

### 3. Run Performance Benchmark

```bash
# Test search performance with sample queries
npm run vectors:benchmark
```

### 4. Adjust Search Quality

```bash
# Fast searches (sub-second, good for real-time)
npm run vectors:quality:fast

# Balanced searches (1-2 seconds, good quality)
npm run vectors:quality:balanced

# High-quality searches (2-5 seconds, best results)
npm run vectors:quality:high
```

## 🏗️ Architecture Optimizations

### 1. Database Indexes

**HNSW (Hierarchical Navigable Small World) Indexes:**

- `idx_article_title_vector_hnsw` - For title vector searches
- `idx_article_content_vector_hnsw` - For content vector searches
- Optimized with `m=16, ef_construction=64` for 6M+ rows

**Composite Indexes:**

- `idx_article_vector_composite` - For filtering + vector operations
- `idx_article_published_vectors` - For published article queries
- `idx_article_status_optimized` - For status-based filtering

### 2. Application-Level Optimizations

**Connection Pooling:**

- Singleton Prisma client instance
- Prevents connection overhead
- Optimized for concurrent requests

**Embedding Caching:**

- LRU cache for generated embeddings
- Prevents redundant embedding generation
- 1000-item cache limit

**Query Optimization:**

- Truncated content in results (500 chars)
- Distance filtering to reduce result sets
- Parallel batch operations

### 3. Memory & Performance Settings

**PostgreSQL Configuration:**

```sql
work_mem = 256MB              -- For vector operations
maintenance_work_mem = 2GB    -- For index creation
effective_cache_size = 4GB    -- Cache optimization
random_page_cost = 1.1        -- SSD optimization
```

**HNSW Search Parameters:**

- `ef_search = 40` (fast)
- `ef_search = 100` (balanced)
- `ef_search = 200` (high quality)

## 📈 Usage Examples

### Basic Vector Search

```typescript
import { VectorSearchService } from "@/lib/vector-search";

const searchService = new VectorSearchService();

// Fast approximate search
const results = await searchService.searchArticles({
  searchTerm: "artificial intelligence",
  limit: 10,
  searchType: "hybrid",
  useApproximateSearch: true,
  efSearch: 40,
  minSimilarity: 0.7,
});
```

### Batch Search Operations

```typescript
// Search multiple terms in parallel
const batchResults = await searchService.batchSearchArticles(
  ["machine learning", "neural networks", "deep learning"],
  5,
  "hybrid",
);
```

### Similar Articles

```typescript
// Find articles similar to a specific article
const similarArticles = await searchService.findSimilarArticles(
  "article-id-here",
  5,
  true, // use approximate search
  100, // ef_search parameter
);
```

## 🔍 Monitoring & Maintenance

### Health Checks

```typescript
// Check index health and statistics
const health = await searchService.checkVectorIndexes();
console.log(health);
```

### Performance Monitoring

```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'Article';

-- Monitor query performance
SELECT * FROM pg_stat_statements WHERE query LIKE '%vector%';

-- Check index sizes
SELECT * FROM check_vector_index_health();
```

### Regular Maintenance

```bash
# Update table statistics (run weekly)
psql -d your_database -c "ANALYZE \"Article\";"

# Check for index bloat (run monthly)
npm run vectors:health
```

## ⚙️ Configuration Options

### Search Quality Levels

| Level    | ef_search | Response Time | Use Case               |
| -------- | --------- | ------------- | ---------------------- |
| Fast     | 40        | <1 second     | Real-time user queries |
| Balanced | 100       | 1-2 seconds   | General search         |
| Quality  | 200       | 2-5 seconds   | Research/analysis      |

### Memory Requirements

| Dataset Size  | Recommended RAM | work_mem | shared_buffers |
| ------------- | --------------- | -------- | -------------- |
| 1M articles   | 8GB             | 128MB    | 2GB            |
| 5M articles   | 16GB            | 256MB    | 4GB            |
| 10M+ articles | 32GB+           | 512MB    | 8GB            |

## 🚨 Troubleshooting

### Slow Queries

1. **Check if indexes exist:**

   ```bash
   npm run vectors:health
   ```

2. **Verify HNSW parameters:**

   ```sql
   SHOW hnsw.ef_search;
   ```

3. **Analyze query plan:**
   ```sql
   EXPLAIN ANALYZE SELECT ... -- your vector query
   ```

### High Memory Usage

1. **Reduce ef_search parameter:**

   ```bash
   npm run vectors:quality:fast
   ```

2. **Adjust work_mem:**

   ```sql
   SET work_mem = '128MB';
   ```

3. **Enable connection pooling** (PgBouncer recommended)

### Index Creation Issues

1. **Insufficient memory:**

   ```sql
   SET maintenance_work_mem = '4GB';
   ```

2. **Long-running transactions:**

   - Use `CREATE INDEX CONCURRENTLY`
   - Run during low-traffic periods

3. **Disk space:**
   - HNSW indexes ~20-30% of table size
   - Monitor disk usage during creation

## 📚 Advanced Topics

### Custom Distance Functions

```sql
-- Use different distance metrics
CREATE INDEX ON "Article" USING hnsw ("titleVector" vector_l2_ops);     -- L2 distance
CREATE INDEX ON "Article" USING hnsw ("titleVector" vector_ip_ops);     -- Inner product
CREATE INDEX ON "Article" USING hnsw ("titleVector" vector_cosine_ops); -- Cosine (default)
```

### Hybrid Search Optimization

```typescript
// Optimize weights for your use case
const results = await searchService.searchArticles({
  searchTerm: "query",
  searchType: "hybrid",
  titleWeight: 0.4, // Increase for title relevance
  contentWeight: 0.6, // Increase for content relevance
});
```

### Batch Vector Generation

```bash
# Generate vectors for all articles
npm run vectors:generate
```

## 🔗 Related Files

- `src/lib/vector-search.ts` - Main vector search implementation
- `scripts/optimize-vector-db.sql` - Database optimization script
- `scripts/optimize-vector-performance.ts` - Performance optimization tools
- `scripts/generate-vectors.ts` - Vector generation script

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Run `npm run vectors:health` for diagnostics
3. Review PostgreSQL logs for errors
4. Monitor system resources during operations

---

**Note:** These optimizations are specifically tuned for large datasets (6M+ articles). For smaller datasets, you may want to adjust parameters accordingly.

# Vector Search Implementation

This document describes the vector search functionality implemented in the WikiClone application using pgvector and Transformers.js.

## Overview

The vector search system provides semantic search capabilities that go beyond simple text matching. It uses machine learning embeddings to understand the meaning and context of search queries and article content.

## Features

- **Semantic Search**: Find articles based on meaning, not just keyword matching
- **Multiple Search Types**: Title-only, content-only, or hybrid search
- **Similar Articles**: Find articles similar to a given article
- **Configurable Weights**: Adjust the importance of title vs content matching
- **Fallback Support**: Gracefully falls back to traditional search if vector search fails

## Architecture

### Components

1. **Vector Search Service** (`src/lib/vector-search.ts`)

   - Handles embedding generation using Xenova/all-MiniLM-L6-v2 model
   - Provides vector search functionality using pgvector
   - Manages database connections for vector operations

2. **API Integration** (`src/server/api/routers/user/articles.ts`)

   - Enhanced `getAll` procedure with vector search support
   - New `findSimilarArticles` procedure for similarity search
   - Fallback mechanisms for reliability

3. **Vector Generation Script** (`scripts/generate-vectors.ts`)
   - Batch processing of existing articles
   - Generates and stores vector embeddings
   - Progress tracking and error handling

### Database Schema

The `Article` model includes vector fields:

```prisma
model Article {
  // ... existing fields ...

  // Vector fields for embeddings (384 dimensions)
  titleVector   Unsupported("vector(384)")?
  contentVector Unsupported("vector(384)")?
  vectorsGeneratedAt DateTime?

  // ... rest of model ...
}
```

## Setup

### 1. Install Dependencies

The required dependencies are already included in `package.json`:

```bash
npm install
```

Key dependencies:

- `pg`: PostgreSQL client
- `pgvector`: Vector similarity search for PostgreSQL
- `@xenova/transformers`: Machine learning models in JavaScript

### 2. Database Setup

Ensure your PostgreSQL database has the pgvector extension enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Generate Vectors for Existing Articles

Run the vector generation script to create embeddings for existing articles:

```bash
npm run vectors:generate
```

This script will:

- Process all published and approved articles
- Generate title and content embeddings
- Store vectors in the database
- Skip articles that already have recent vectors

### 4. Create Vector Indexes (Optional but Recommended)

For better performance with large datasets, create HNSW indexes:

```sql
CREATE INDEX ON "Article" USING hnsw ("titleVector" vector_cosine_ops);
CREATE INDEX ON "Article" USING hnsw ("contentVector" vector_cosine_ops);
```

## Usage

### API Endpoints

#### Enhanced Article Search

The `getAll` procedure now supports vector search:

```typescript
// Enable vector search with hybrid mode (default)
const result = await api.user.articles.getAll.query({
  searchTerm: "artificial intelligence",
  vectorSearch: true,
  vectorSearchType: "hybrid", // "title" | "content" | "hybrid"
  titleWeight: 0.3,
  contentWeight: 0.7,
  limit: 10,
});
```

#### Find Similar Articles

Find articles similar to a given article:

```typescript
const similar = await api.user.articles.findSimilarArticles.query({
  articleId: "article-id-here",
  limit: 5,
});
```

### Search Types

1. **Title Search** (`vectorSearchType: "title"`)

   - Searches only article titles
   - Fast and focused on topic matching

2. **Content Search** (`vectorSearchType: "content"`)

   - Searches article content
   - More comprehensive but slower

3. **Hybrid Search** (`vectorSearchType: "hybrid"`)
   - Combines title and content search
   - Configurable weights for title vs content importance
   - Recommended for most use cases

### Response Format

Vector search responses include additional metadata:

```typescript
{
  articles: [
    {
      // ... standard article fields ...
      vectorDistance: 0.234,      // Overall similarity score
      titleDistance?: 0.123,      // Title similarity (hybrid only)
      contentDistance?: 0.345     // Content similarity (hybrid only)
    }
  ],
  vectorSearch: true,
  searchType: "hybrid"
}
```

## Performance Considerations

### Embedding Generation

- Embeddings are generated using the all-MiniLM-L6-v2 model (384 dimensions)
- Model is cached in memory after first use
- Content is truncated to 8000 characters for performance

### Database Performance

- Vector operations use cosine distance (`<=>`) by default
- HNSW indexes significantly improve query performance
- Consider index parameters for your specific use case

### Caching

- The embedding model is cached as a singleton
- Consider implementing Redis caching for frequently searched terms
- Vector results could be cached for popular queries

## Error Handling

The system includes comprehensive error handling:

1. **Graceful Fallback**: If vector search fails, falls back to traditional text search
2. **Connection Management**: Proper database connection lifecycle management
3. **Validation**: Input validation and sanitization
4. **Logging**: Detailed error logging for debugging

## Monitoring and Maintenance

### Vector Generation Monitoring

The generation script provides detailed statistics:

- Total articles processed
- Success/failure rates
- Processing time estimates

### Database Maintenance

- Monitor vector index performance
- Consider regenerating vectors periodically for updated content
- Track vector generation timestamps

## Troubleshooting

### Common Issues

1. **Vector search returns no results**

   - Check if vectors have been generated for articles
   - Verify pgvector extension is installed
   - Check database connection configuration

2. **Slow performance**

   - Create HNSW indexes on vector columns
   - Adjust batch sizes in generation script
   - Consider content length limits

3. **Memory issues**
   - Monitor embedding model memory usage
   - Adjust batch sizes for vector generation
   - Consider model caching strategies

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
DEBUG=vector-search npm run dev
```

## Future Enhancements

Potential improvements to consider:

1. **Multiple Models**: Support for different embedding models
2. **Incremental Updates**: Real-time vector generation for new articles
3. **Advanced Filtering**: Combine vector search with category/tag filters
4. **Personalization**: User-specific search result ranking
5. **Analytics**: Search query analysis and optimization

## References

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [all-MiniLM-L6-v2 Model](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)

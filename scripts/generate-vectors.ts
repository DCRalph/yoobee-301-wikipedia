import { PrismaClient } from '@prisma/client'
import { Client } from 'pg'
import pgvector from 'pgvector'
import { pipeline } from '@xenova/transformers'
import pLimit from 'p-limit'
import cliProgress from 'cli-progress'

const prisma = new PrismaClient()

interface Article {
  id: string
  title: string
  content: string
}

class VectorGenerator {
  private pgClient: Client
  private embedder: any
  private progressBar: cliProgress.SingleBar
  private limit = pLimit(5) // Limit concurrent operations
  private cleanedArticlesCount = 0 // Track how many articles were cleaned

  constructor() {
    this.pgClient = new Client({
      connectionString:
        'postgres://postgres:amadmin1@10.99.0.37:5432/postgres',
    })

    this.progressBar = new cliProgress.SingleBar({
      format:
        'Generating Vectors |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s | Rate: {rate}/s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    })
  }

  async initialize() {
    console.log('🚀 Initializing Vector Generator with pgvector...\n')

    // Connect to database
    await this.pgClient.connect()
    console.log('✅ Connected to PostgreSQL')

    // Enable vector extension
    await this.pgClient.query('CREATE EXTENSION IF NOT EXISTS vector')
    console.log('✅ Vector extension enabled')

    // Create a partial index to speed up queries for articles still
    // needing vector generation
    console.log('📈 Creating partial index for pending vectors...')
    await this.pgClient.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_vectors_pending
      ON "Article" ("vectorsGeneratedAt")
      WHERE "vectorsGeneratedAt" IS NULL;
    `)
    console.log('✅ Partial index created\n')

    // Load embedding model
    console.log(
      '📥 Loading embedding model (this may take a moment)...'
    )
    this.embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    )
    console.log('✅ Embedding model loaded\n')
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Clean and truncate text if too long
      const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 8000)

      const embedding = await this.embedder(cleanText, {
        pooling: 'mean',
        normalize: true,
      })

      return Array.from(embedding.data)
    } catch (error) {
      console.error('Error generating embedding:', error)
      // Return a zero vector as fallback
      return new Array(384).fill(0)
    }
  }

  cleanContent(content: string): string {
    const pattern = /^:::summary\s*:::\s*\n\s*# /

    if (pattern.test(content)) {
      // Remove the pattern from the content
      return content.replace(pattern, '# ')
    }

    return content
  }

  async getArticlesNeedingVectors(batchSize: number = 100): Promise<Article[]> {
    // Use raw SQL to get articles that have not been processed,
    // filtering by vectorsGeneratedAt.
    const result = await this.pgClient.query(
      `
      SELECT id, title, content 
      FROM "Article" 
      WHERE "vectorsGeneratedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT $1
    `,
      [batchSize]
    )

    return result.rows
  }

  async updateArticleVectors(
    articleId: string,
    titleVector: number[],
    contentVector: number[],
    cleanedContent?: string
  ) {
    try {
      if (cleanedContent !== undefined) {
        // Update vectors and content
        await this.pgClient.query(
          `
          UPDATE "Article" 
          SET 
            "titleVector" = $1::vector,
            "contentVector" = $2::vector,
            "content" = $3,
            "vectorsGeneratedAt" = NOW()
          WHERE id = $4
        `,
          [
            pgvector.toSql(titleVector),
            pgvector.toSql(contentVector),
            cleanedContent,
            articleId,
          ]
        )
      } else {
        // Update only vectors
        await this.pgClient.query(
          `
          UPDATE "Article" 
          SET 
            "titleVector" = $1::vector,
            "contentVector" = $2::vector,
            "vectorsGeneratedAt" = NOW()
          WHERE id = $3
        `,
          [
            pgvector.toSql(titleVector),
            pgvector.toSql(contentVector),
            articleId,
          ]
        )
      }
    } catch (error) {
      console.error(
        `Error updating vectors for article ${articleId}:`,
        error
      )
      throw error
    }
  }

  async processArticleBatch(articles: Article[]): Promise<void> {
    const promises = articles.map((article) =>
      this.limit(async () => {
        try {
          // Clean the content first
          const cleanedContent = this.cleanContent(article.content)
          const contentWasCleaned = cleanedContent !== article.content

          if (contentWasCleaned) {
            this.cleanedArticlesCount++
          }

          // Generate embeddings for title and cleaned content
          const [titleVector, contentVector] = await Promise.all([
            this.generateEmbedding(article.title),
            this.generateEmbedding(cleanedContent),
          ])

          // Update database with vectors and cleaned content if modified
          await this.updateArticleVectors(
            article.id,
            titleVector,
            contentVector,
            contentWasCleaned ? cleanedContent : undefined
          )

          this.progressBar.increment()
        } catch (error) {
          console.error(`\nError processing article ${article.id}:`, error)
          this.progressBar.increment() // Avoid hanging progress
        }
      })
    )

    await Promise.all(promises)
  }

  async generateAllVectors() {
    try {
      // Get total count of articles needing vectors using the new filter
      const countResult = await this.pgClient.query(`
        SELECT COUNT(*) as count
        FROM "Article" 
        WHERE "vectorsGeneratedAt" IS NULL
      `)

      const totalArticles = parseInt(countResult.rows[0].count)

      if (totalArticles === 0) {
        console.log('🎉 All articles already have vectors!')
        return
      }

      console.log(
        `📊 Found ${totalArticles.toLocaleString()} articles needing vectors`
      )
      console.log('🔄 Starting vector generation...\n')

      // Initialize progress bar
      this.progressBar.start(totalArticles, 0)

      const batchSize = 50 // Process in batches
      let processed = 0

      while (processed < totalArticles) {
        // Get next batch of articles
        const articles = await this.getArticlesNeedingVectors(batchSize)

        if (articles.length === 0) {
          break // No more articles to process
        }

        // Process batch
        await this.processArticleBatch(articles)
        processed += articles.length

        // Small delay to prevent overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      this.progressBar.stop()
      console.log('\n✅ Vector generation completed!')

      if (this.cleanedArticlesCount > 0) {
        console.log(
          `🧹 Cleaned content for ${this.cleanedArticlesCount.toLocaleString()} articles`
        )
      }

      // Verify the results
      await this.verifyResults()
    } catch (error) {
      this.progressBar.stop()
      console.error('\n❌ Vector generation failed:', error)
      throw error
    }
  }

  async verifyResults() {
    console.log('\n🔍 Verifying results...')

    const result = await this.pgClient.query(`
      SELECT 
        COUNT(*) as total,
        COUNT("titleVector") as title_vectors,
        COUNT("contentVector") as content_vectors,
        COUNT(CASE WHEN "titleVector" IS NOT NULL AND "contentVector" IS NOT NULL THEN 1 END) as complete_vectors
      FROM "Article"
    `)

    const stats = result.rows[0]

    console.log(`📊 Total articles: ${parseInt(stats.total).toLocaleString()}`)
    console.log(
      `📊 Articles with title vectors: ${parseInt(
        stats.title_vectors
      ).toLocaleString()}`
    )
    console.log(
      `📊 Articles with content vectors: ${parseInt(
        stats.content_vectors
      ).toLocaleString()}`
    )
    console.log(
      `📊 Articles with complete vectors: ${parseInt(
        stats.complete_vectors
      ).toLocaleString()}`
    )

    const completionRate =
      (parseInt(stats.complete_vectors) / parseInt(stats.total)) * 100
    console.log(`📈 Completion rate: ${completionRate.toFixed(1)}%`)

    // Test a similarity search if any article has complete vectors
    if (parseInt(stats.complete_vectors) > 0) {
      console.log('\n🧪 Testing similarity search...')
      await this.testSimilaritySearch()
    }
  }

  async testSimilaritySearch() {
    try {
      // Get a random article with vectors
      const sampleResult = await this.pgClient.query(`
        SELECT id, title, "titleVector"
        FROM "Article" 
        WHERE "titleVector" IS NOT NULL 
        ORDER BY RANDOM() 
        LIMIT 1
      `)

      if (sampleResult.rows.length === 0) {
        console.log('❌ No articles with vectors found for testing')
        return
      }

      const sampleArticle = sampleResult.rows[0]

      // Find similar articles
      const similarResult = await this.pgClient.query(
        `
        SELECT id, title, "titleVector" <=> $1 as distance
        FROM "Article" 
        WHERE "titleVector" IS NOT NULL AND id != $2
        ORDER BY "titleVector" <=> $1 
        LIMIT 5
      `,
        [sampleArticle.titleVector, sampleArticle.id]
      )

      console.log(`🔍 Similar articles to "${sampleArticle.title}":`)
      similarResult.rows.forEach((row, i) => {
        console.log(
          `   ${i + 1}. "${row.title}" (distance: ${parseFloat(
            row.distance
          ).toFixed(4)})`
        )
      })
    } catch (error) {
      console.error('❌ Similarity search test failed:', error)
    }
  }

  async cleanup() {
    await this.pgClient.end()
    await prisma.$disconnect()
  }
}

async function main() {
  const generator = new VectorGenerator()

  try {
    await generator.initialize()
    await generator.generateAllVectors()

    console.log(
      '\n🎉 Vector generation process completed successfully!'
    )
    console.log('💡 You can now use similarity search in your application')
    console.log("🔍 Run 'npm run test-embedding' to test similarity search")
  } catch (error) {
    console.error('❌ Vector generation failed:', error)
    process.exit(1)
  } finally {
    await generator.cleanup()
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Received SIGINT, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Received SIGTERM, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

main()

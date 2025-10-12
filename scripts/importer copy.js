import { Worker, isMainThread, parentPort } from 'worker_threads'
import fs from 'fs'
import readline from 'readline'
import { PrismaClient } from '@prisma/client'
import convertWikiToMD from './wikipedia_to_blip.js'
import pgvector from 'pgvector'
import { pipeline } from '@xenova/transformers'
import { createId } from '@paralleldrive/cuid2'
import { cleanContent } from './cleanContent.js'

/////////////////////////////
// Configuration
/////////////////////////////

const MIN_CHAR_LENGTH = 150 // Minimum required characters.
const WORKER_COUNT = 10 // Number of worker threads.
const JOB_QUEUE_MAX = 100 // Maximum pending jobs before pausing stream.
const START_FROM_ARTICLE = 3_208_000 // Skip initial lines, if needed.
const BATCH_SIZE = 5 // Number of articles to process in a batch

/////////////////////////////
// Helper Functions (Shared)
/////////////////////////////

// Converts a title to a URL‑friendly slug.
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

let embedder
// const limit = pLimit(5) // Limit concurrent operations

embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

async function generateEmbedding(text) {
  try {
    // Clean and truncate text if too long
    const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 8000)

    const embedding = await embedder(cleanText, {
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

// If the content starts with ":::summary", extract the summary block and the remaining content.
function extractSummaryAndContent(content) {
  const lines = content.split('\n')
  if (lines[0]?.trim() !== ':::summary') {
    return { summary: null, content }
  }
  const summaryLines = []
  let i = 1
  for (; i < lines.length; i++) {
    if (lines[i].trim() === ':::') break
    summaryLines.push(lines[i])
  }
  const summary = summaryLines.join('\n').trim()
  const newContent = lines
    .slice(i + 1)
    .join('\n')
    .trim()
  return { summary, content: newContent }
}

// Parses a summary markdown block into key/value pairs.
// Expected each line to be of the format: "**Key:** Value"
function parseSummary(summary) {
  const keyValuePairs = {}
  const lines = summary.split('\n')
  const regex = /^\*\*(.+?)\*\*\s*(.*)$/
  for (const line of lines) {
    const match = regex.exec(line.trim())
    if (match) {
      let key = match[1].trim()
      if (key.endsWith(':')) {
        key = key.slice(0, -1).trim()
      }
      const value = match[2].trim()
      if (key && value) {
        keyValuePairs[key] = value
      }
    }
  }
  return keyValuePairs
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, index)).toFixed(4) + ' ' + units[index]
}

if (isMainThread) {
  /////////////////////////////
  // MAIN THREAD CODE
  /////////////////////////////

  const [, , inputPath] = process.argv
  if (!inputPath) {
    console.error('Usage: node importer.js <input.jsonl>')
    process.exit(1)
  }

  // Progress counters
  let totalLinesProcessed = 0
  let totalSuccess = 0
  let totalErrors = 0
  // New skip counters by reason.
  let totalSkippedLength = 0
  let totalSkippedAlreadyExists = 0
  let totalSkippedOther = 0

  // Tracking for articles per second and per hour
  const successHistory = [] // Array to store timestamps of successful articles

  // Tracking for timing metrics
  const computeTimeHistory = [] // Array to store compute times
  const dbTimeHistory = [] // Array to store database insertion times

  // Set up a job queue and a flag to mark when the input file has finished.
  const jobQueue = []
  let readStreamFinished = false

  // Batch processing queue for collecting articles before sending to workers
  const batchQueue = []

  // Create a worker pool. Each worker is tracked along with whether it is busy.
  const workers = []
  for (let i = 0; i < WORKER_COUNT; i++) {
    const worker = new Worker(new URL(import.meta.url))
    const workerObj = { worker, busy: false, id: i }

    worker.on('message', (msg) => {
      if (msg.error) {
        totalErrors++
        console.error(`[Worker ${workerObj.id}] Error: ${msg.error}`)
        console.error(`[Worker ${workerObj.id}] Stack: ${msg.stack}`)
      } else if (msg.batchResults) {
        // Handle batch results
        const { results } = msg.batchResults

        for (const result of results) {
          if (result.error) {
            totalErrors++
            console.error(`[Worker ${workerObj.id}] Error: ${result.error}`)
          } else if (result.skipped) {
            // Classify the skip reason based on its message.
            if (
              result.skipped.includes('Too short') ||
              result.skipped.includes('Converted content too short')
            ) {
              totalSkippedLength++
            } else if (result.skipped.includes('Article already exists')) {
              totalSkippedAlreadyExists++
            } else {
              totalSkippedOther++
            }
          } else if (result.success) {
            totalSuccess++
            // Track successful article with timestamp for rate calculations
            const now = Date.now()
            successHistory.push(now)

            // Track timing metrics
            if (result.computeTime) {
              computeTimeHistory.push({
                time: result.computeTime,
                timestamp: now,
              })
            }
            if (result.dbTime) {
              dbTimeHistory.push({ time: result.dbTime, timestamp: now })
            }
          }
        }

        // Clean up old entries (keep only last 2 minutes for per-hour calculation)
        const now = Date.now()
        const twoMinutesAgo = now - 2 * 60 * 1000
        while (successHistory.length > 0 && successHistory[0] < twoMinutesAgo) {
          successHistory.shift()
        }

        // Clean up old timing entries (keep only last 10 seconds for averaging)
        const tenSecondsAgo = now - 10 * 1000
        while (
          computeTimeHistory.length > 0 &&
          computeTimeHistory[0].timestamp < tenSecondsAgo
        ) {
          computeTimeHistory.shift()
        }
        while (
          dbTimeHistory.length > 0 &&
          dbTimeHistory[0].timestamp < tenSecondsAgo
        ) {
          dbTimeHistory.shift()
        }
      } else if (msg.message) {
        // Optionally log other messages.
        console.log(`[Worker ${workerObj.id}] Message: ${msg.message}`)
      }
      // Mark worker as free and try to dispatch another job.
      workerObj.busy = false
      dispatchJobs()
    })

    worker.on('error', (err) =>
      console.error(`[Worker ${workerObj.id}] Error: ${err}`)
    )
    worker.on('exit', (code) => {
      if (code !== 0)
        console.error(`[Worker ${workerObj.id}] Exited with code ${code}`)
    })
    workers.push(workerObj)
  }

  // Function to dispatch available jobs to free workers.
  function dispatchJobs() {
    // Process batches from batchQueue
    while (batchQueue.length >= BATCH_SIZE) {
      const batch = batchQueue.splice(0, BATCH_SIZE)
      jobQueue.push({ type: 'batch', articles: batch })
    }

    // If stream finished and we have remaining articles, send them as a partial batch
    if (readStreamFinished && batchQueue.length > 0) {
      const batch = batchQueue.splice(0, batchQueue.length)
      jobQueue.push({ type: 'batch', articles: batch })
    }

    for (const workerObj of workers) {
      if (!workerObj.busy && jobQueue.length > 0) {
        const job = jobQueue.shift()
        workerObj.busy = true
        workerObj.worker.postMessage(job)
      }
    }
    // Resume input stream (if paused) when the job queue is below half the maximum.
    if (
      jobQueue.length < JOB_QUEUE_MAX / 2 &&
      rl.input.readableFlowing === false
    ) {
      rl.resume()
    }
    // If the stream has ended, the job queue is empty, and all workers are free, finish.
    if (
      readStreamFinished &&
      jobQueue.length === 0 &&
      batchQueue.length === 0 &&
      workers.every((w) => !w.busy)
    ) {
      console.log('All jobs processed. Exiting.')
      process.exit(0)
    }
  }

  // Set up the input stream and monitor its progress.
  const inputStream = fs.createReadStream(inputPath)
  const totalSize = fs.statSync(inputPath).size
  let bytesRead = 0
  let lastLoggedPercentage = 0

  inputStream.on('data', (chunk) => {
    bytesRead += chunk.length
    const currentPercentage = Math.floor((bytesRead / totalSize) * 100)
    if (currentPercentage > lastLoggedPercentage) {
      lastLoggedPercentage = currentPercentage
      console.log(`File read progress: ${currentPercentage}%`)
    }
  })

  // Create a readline interface to stream through the input file.
  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  })

  rl.on('line', (line) => {
    totalLinesProcessed++
    if (totalLinesProcessed < START_FROM_ARTICLE) return
    batchQueue.push(line)

    // Pause reading if we have too many batches queued
    if (jobQueue.length >= JOB_QUEUE_MAX) {
      rl.pause()
    }
    dispatchJobs()
  })

  rl.on('close', () => {
    console.log('Finished reading file.')
    readStreamFinished = true
    dispatchJobs()
  })

  // Periodically log overall progress
  const progressInterval = setInterval(() => {
    const busyWorkers = workers.filter((w) => w.busy).length

    // Calculate articles per second (10 second average)
    const now = Date.now()
    const tenSecondsAgo = now - 10 * 1000
    const articlesInLast10Sec = successHistory.filter(
      (timestamp) => timestamp >= tenSecondsAgo
    ).length
    const articlesPerSecond = articlesInLast10Sec / 10

    // Calculate articles per hour (2 minute average)
    const twoMinutesAgo = now - 2 * 60 * 1000
    const articlesInLast2Min = successHistory.filter(
      (timestamp) => timestamp >= twoMinutesAgo
    ).length
    const articlesPerHour = (articlesInLast2Min / 2) * 60 // Convert per-2-minutes to per-hour

    // Calculate average timing metrics (10 second average)
    const avgComputeTime =
      computeTimeHistory.length > 0
        ? computeTimeHistory.reduce((sum, entry) => sum + entry.time, 0) /
          computeTimeHistory.length
        : 0
    const avgDbTime =
      dbTimeHistory.length > 0
        ? dbTimeHistory.reduce((sum, entry) => sum + entry.time, 0) /
          dbTimeHistory.length
        : 0

    console.log(`Progress Update:
  Lines processed:         ${totalLinesProcessed}
  Success:                 ${totalSuccess}
  Skipped (length):        ${totalSkippedLength}
  Skipped (already exists):${totalSkippedAlreadyExists}
  Skipped (other):         ${totalSkippedOther}
  Errors:                  ${totalErrors}
  Jobs queued:             ${jobQueue.length}
  Workers busy:            ${busyWorkers}
  Articles/sec:            ${articlesPerSecond.toFixed(2)}
  Articles/hour:           ${articlesPerHour.toFixed(0)}
  Avg compute time:        ${avgComputeTime.toFixed(0)}ms
  Avg DB time:             ${avgDbTime.toFixed(0)}ms
  File read:               ${lastLoggedPercentage}%
  Bytes read:              ${formatBytes(bytesRead)}
  Total size:              ${formatBytes(totalSize)}
  `)
  }, 1000) // Update every second (adjust as needed)

  process.on('exit', () => {
    clearInterval(progressInterval)
  })
} else {
  /////////////////////////////
  // WORKER THREAD CODE
  /////////////////////////////

  const prisma = new PrismaClient()

  parentPort.on('message', async (job) => {
    if (job.type === 'batch') {
      await processBatch(job.articles)
    }
  })

  async function processBatch(articleLines) {
    const batchResults = []
    const articlesToInsert = []

    try {
      // Process each article in the batch
      for (const line of articleLines) {
        try {
          const result = await processArticle(line)
          if (result.success && result.articleData) {
            articlesToInsert.push(result.articleData)
            batchResults.push({
              success: true,
              computeTime: result.computeTime,
            })
          } else if (result.skipped) {
            batchResults.push({ skipped: result.skipped })
          }
        } catch (error) {
          batchResults.push({
            error: error.message,
            stack: error.stack,
          })
        }
      }

      // Batch insert all valid articles
      if (articlesToInsert.length > 0) {
        const dbStartTime = Date.now()
        await batchInsertArticles(articlesToInsert)
        const dbEndTime = Date.now()
        const dbTime = dbEndTime - dbStartTime

        // Update results with DB time
        batchResults.forEach((result) => {
          if (result.success) {
            result.dbTime = dbTime / articlesToInsert.length // Average DB time per article
          }
        })
      }

      parentPort.postMessage({
        batchResults: {
          results: batchResults,
        },
      })
    } catch (error) {
      parentPort.postMessage({
        error: error.message,
        stack: error.stack,
      })
    }
  }

  function escapeSqlString(value) {
    if (value === null || typeof value === 'undefined') {
      return 'NULL' // Or handle as per your DB requirements for NULLs
    }
    // Replace single quotes with two single quotes for SQL compatibility
    return String(value).replace(/'/g, "''")
  }

  async function processArticle(line) {
    const startTime = Date.now()

    const article = JSON.parse(line)

    // Skip if the article's raw text is too short.
    if (!article.raw_text || article.raw_text.length < MIN_CHAR_LENGTH) {
      return {
        skipped: `Too short: ${article.title} (${
          article.raw_text ? article.raw_text.length : 0
        })`,
      }
    }

    const title = article.title
    let content = await convertWikiToMD(article.raw_text)

    if (content.length < MIN_CHAR_LENGTH * 0.7) {
      return {
        skipped: `Converted content too short: ${article.title} (${content.length})`,
      }
    }

    // Extract summary block, if present.
    const { summary, content: newContent } = extractSummaryAndContent(content)
    if (summary) {
      content = newContent
    }

    const cleanedContent = cleanContent(content)
    const parsedSummary = summary ? parseSummary(summary) : {}

    if (!cleanedContent || cleanedContent.length < MIN_CHAR_LENGTH) {
      return {
        skipped: `Too short: ${article.title} (${
          cleanedContent ? cleanedContent.length : 0
        })`,
      }
    }

    if (
      (cleanedContent.length < 100 &&
        cleanedContent.includes('may refer to:')) ||
      cleanedContent.endsWith('may refer to:')
    ) {
      return {
        skipped: `Too short: ${article.title} (${
          cleanedContent ? cleanedContent.length : 0
        })`,
      }
    }

    const slug = slugify(title)

    // Check if the article already exists.
    const existingArticleResult = await prisma.$queryRaw`SELECT "id" FROM "Article" WHERE "slug" = ${slug} LIMIT 1`;

    if (existingArticleResult && existingArticleResult.length > 0) {
      return {
        skipped: `Article already exists: ${title}`,
      };
    }

    const [titleVector, contentVector] = await Promise.all([
      generateEmbedding(article.title),
      generateEmbedding(cleanedContent),
    ])

    const titleVectorSql = pgvector.toSql(titleVector)
    const contentVectorSql = pgvector.toSql(contentVector)

    // Generate a unique ID for the article
    const articleId = createId()

    const computeEndTime = Date.now()
    const computeTime = computeEndTime - startTime

    return {
      success: true,
      computeTime: computeTime,
      articleData: {
        id: articleId,
        title: title,
        content: cleanedContent,
        slug: slug,
        quickFacts: parsedSummary,
        titleVector: titleVectorSql,
        contentVector: contentVectorSql,
      },
    }
  }

  async function batchInsertArticles(articles) {
    if (articles.length === 0) return

    // Build the VALUES clause for batch insert
    const values = articles
      .map(
        (article) =>
          `(${[
            `'${escapeSqlString(article.id)}'`,
            `'${escapeSqlString(article.title)}'`,
            `'${escapeSqlString(article.content)}'`,
            `'${escapeSqlString(article.slug)}'`,
            'true', // approved
            'false', // needsApproval
            'NOW()', // approvedAt
            `'cmb50c2pc0000ocvwtyy4bxcu'`, // approvedBy (assuming this is a safe, hardcoded ID)
            'true', // published
            `'cmb50c2pc0000ocvwtyy4bxcu'`, // authorId (assuming this is a safe, hardcoded ID)
            `'${escapeSqlString(JSON.stringify(article.quickFacts))}'::jsonb`, // quickFacts
            `'${article.titleVector}'::vector`, // titleVector (output of pgvector.toSql is typically safe)
            `'${article.contentVector}'::vector`, // contentVector (output of pgvector.toSql is typically safe)
            'NOW()', // vectorsGeneratedAt
            'NOW()', // createdAt
            'NOW()', // updatedAt
            '0', // viewCount
            '0', // dailyViews
            'NOW()', // lastViewReset
            'false', // isFeatured
            `''`, // sources (empty string)
            `''`, // talkContent (empty string)
          ].join(', ')})`
      )
      .join(', ')

    const query = `
      INSERT INTO "Article" (
        id, title, content, slug, approved, "needsApproval", "approvedAt", "approvedBy", 
        published, "authorId", "quickFacts", "titleVector", "contentVector", "vectorsGeneratedAt", 
        "createdAt", "updatedAt", "viewCount", "dailyViews", "lastViewReset", "isFeatured", 
        "sources", "talkContent"
      )
      VALUES ${values}
      ON CONFLICT (slug) DO NOTHING
    `

    try {
      await prisma.$executeRawUnsafe(query)
    } catch (error) {
      console.error('Error inserting articles:', error)
      console.error('Query:', query)
      throw error
    }
  }
}

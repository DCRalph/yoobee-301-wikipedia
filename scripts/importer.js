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
const WORKER_COUNT = 32 // Number of worker threads.
const JOB_QUEUE_MAX = 400 // Maximum pending jobs before pausing stream.
// const START_FROM_ARTICLE = 3_160_000 // Skip initial lines, if needed.
const START_FROM_ARTICLE = 1_500_000 // Skip initial lines, if needed.

// Discord webhook URL - set this to your Discord webhook URL
const DISCORD_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1114911541951733761/Esyek2R0Nv6qNoPx8pWBTP1axG-gVSiAK2oDY0Fx82pr6XWsWbXXe8NDlGGxKqMJzaha'

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

// Function to send message to Discord
async function sendDiscordMessage(message) {
  if (
    !DISCORD_WEBHOOK_URL ||
    DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE'
  ) {
    console.log(
      'Discord webhook URL not configured, skipping Discord notification'
    )
    return
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '```\n' + message + '\n```',
      }),
    })

    if (!response.ok) {
      console.error('Failed to send Discord message:', response.statusText)
    }
  } catch (error) {
    console.error('Error sending Discord message:', error.message)
  }
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
  const totalProcessedHistory = [] // Array to store timestamps of all processed articles (success + error + skip)

  // Tracking for timing metrics
  const computeTimeHistory = [] // Array to store compute times
  const dbTimeHistory = [] // Array to store database insertion times
  const dbCheckTimeHistory = [] // Array to store database check times

  // Set up a job queue and a flag to mark when the input file has finished.
  const jobQueue = []
  let readStreamFinished = false

  // Create a worker pool. Each worker is tracked along with whether it is busy.
  const workers = []
  for (let i = 0; i < WORKER_COUNT; i++) {
    const worker = new Worker(new URL(import.meta.url))
    const workerObj = { worker, busy: false, id: i }

    worker.on('message', (msg) => {
      const now = Date.now()

      if (msg.error) {
        totalErrors++
        totalProcessedHistory.push(now)

        // Clean up old entries for consistent timing data
        const twoMinutesAgo = now - 2 * 60 * 1000
        while (
          totalProcessedHistory.length > 0 &&
          totalProcessedHistory[0] < twoMinutesAgo
        ) {
          totalProcessedHistory.shift()
        }

        console.error(`[Worker ${workerObj.id}] Error: ${msg.error}`)
        console.error(`[Worker ${workerObj.id}] Stack: ${msg.stack}`)
      } else if (msg.skipped) {
        totalProcessedHistory.push(now)
        // Track database check time if provided
        if (msg.dbCheckTime) {
          dbCheckTimeHistory.push({ time: msg.dbCheckTime, timestamp: now })
        }

        // Clean up old entries for consistent timing data
        const twoMinutesAgo = now - 2 * 60 * 1000
        while (
          totalProcessedHistory.length > 0 &&
          totalProcessedHistory[0] < twoMinutesAgo
        ) {
          totalProcessedHistory.shift()
        }

        // Clean up old timing entries (10 second average)
        const tenSecondsAgo = now - 10 * 1000
        while (
          dbCheckTimeHistory.length > 0 &&
          dbCheckTimeHistory[0].timestamp < tenSecondsAgo
        ) {
          dbCheckTimeHistory.shift()
        }

        // Classify the skip reason based on its message.
        if (
          msg.skipped.includes('Too short') ||
          msg.skipped.includes('Converted content too short')
        ) {
          totalSkippedLength++
        } else if (msg.skipped.includes('Article already exists')) {
          totalSkippedAlreadyExists++
        } else {
          totalSkippedOther++
        }
        // Optionally, log skip messages if desired:
        // console.log(`[Worker ${workerObj.id}] Skipped: ${msg.skipped}`);
      } else if (msg.success) {
        totalSuccess++
        // Track successful article with timestamp for rate calculations
        successHistory.push(now)
        totalProcessedHistory.push(now)

        // Track timing metrics
        if (msg.computeTime) {
          computeTimeHistory.push({ time: msg.computeTime, timestamp: now })
        }
        if (msg.dbTime) {
          dbTimeHistory.push({ time: msg.dbTime, timestamp: now })
        }
        if (msg.dbCheckTime) {
          dbCheckTimeHistory.push({ time: msg.dbCheckTime, timestamp: now })
        }

        // Clean up old entries (keep only last 2 minutes for per-hour calculation)
        const twoMinutesAgo = now - 2 * 60 * 1000
        while (successHistory.length > 0 && successHistory[0] < twoMinutesAgo) {
          successHistory.shift()
        }
        while (
          totalProcessedHistory.length > 0 &&
          totalProcessedHistory[0] < twoMinutesAgo
        ) {
          totalProcessedHistory.shift()
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
        while (
          dbCheckTimeHistory.length > 0 &&
          dbCheckTimeHistory[0].timestamp < tenSecondsAgo
        ) {
          dbCheckTimeHistory.shift()
        }

        // Optionally log success:
        // console.log(`[Worker ${workerObj.id}] Processed an article successfully.`);
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

  // Function to generate current progress message
  function generateProgressMessage() {
    const busyWorkers = workers.filter((w) => w.busy).length

    // Calculate articles per second (10 second average)
    const now = Date.now()
    const tenSecondsAgo = now - 10 * 1000
    const articlesInLast10Sec = successHistory.filter(
      (timestamp) => timestamp >= tenSecondsAgo
    ).length
    const articlesPerSecond = articlesInLast10Sec / 10

    // Calculate total articles processed per second (10 second average)
    const totalProcessedInLast10Sec = totalProcessedHistory.filter(
      (timestamp) => timestamp >= tenSecondsAgo
    ).length
    const totalProcessedPerSecond = totalProcessedInLast10Sec / 10

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
    const avgDbCheckTime =
      dbCheckTimeHistory.length > 0
        ? dbCheckTimeHistory.reduce((sum, entry) => sum + entry.time, 0) /
          dbCheckTimeHistory.length
        : 0

    return `Progress Update:
  Lines processed:         ${totalLinesProcessed}
  Success:                 ${totalSuccess}
  Skipped (length):        ${totalSkippedLength}
  Skipped (already exists):${totalSkippedAlreadyExists}
  Skipped (other):         ${totalSkippedOther}
  Errors:                  ${totalErrors}
  Jobs queued:             ${jobQueue.length}
  Workers busy:            ${busyWorkers}
  Articles/sec (success):  ${articlesPerSecond.toFixed(2)}
  Articles/sec (total):    ${totalProcessedPerSecond.toFixed(2)}
  Articles/hour:           ${articlesPerHour.toFixed(0)}
  Avg compute time:        ${avgComputeTime.toFixed(0)}ms
  Avg DB time:             ${avgDbTime.toFixed(0)}ms
  Avg DB check time:       ${avgDbCheckTime.toFixed(0)}ms
  File read:               ${lastLoggedPercentage}%
  Bytes read:              ${formatBytes(bytesRead)}
  Total size:              ${formatBytes(totalSize)}`
  }

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
    jobQueue.push(line)
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
    const progressMessage = generateProgressMessage()
    console.log(progressMessage)
  }, 1000) // Update every second (adjust as needed)

  // Send Discord updates every 5 minutes
  const discordInterval = setInterval(
    () => {
      const progressMessage = generateProgressMessage()
      sendDiscordMessage(progressMessage).catch((err) =>
        console.error('Failed to send Discord message:', err.message)
      )
    },
    5 * 60 * 1000
  ) // Update every 5 minutes

  process.on('exit', () => {
    clearInterval(progressInterval)
    clearInterval(discordInterval)
  })
} else {
  /////////////////////////////
  // WORKER THREAD CODE
  /////////////////////////////

  const prisma = new PrismaClient()

  parentPort.on('message', async (line) => {
    try {
      const startTime = Date.now()

      const article = JSON.parse(line)

      // Skip if the article's raw text is too short.
      if (!article.raw_text || article.raw_text.length < MIN_CHAR_LENGTH) {
        return parentPort.postMessage({
          skipped: `Too short: ${article.title} (${
            article.raw_text ? article.raw_text.length : 0
          })`,
        })
      }

      const title = article.title
      let content = await convertWikiToMD(article.raw_text)

      if (content.length < MIN_CHAR_LENGTH * 0.7) {
        return parentPort.postMessage({
          skipped: `Converted content too short: ${article.title} (${content.length})`,
        })
      }

      // Extract summary block, if present.
      const { summary, content: newContent } = extractSummaryAndContent(content)
      if (summary) {
        content = newContent
      }

      const cleanedContent = cleanContent(content)
      const parsedSummary = summary ? parseSummary(summary) : {}

      if (!cleanedContent || cleanedContent.length < MIN_CHAR_LENGTH) {
        return parentPort.postMessage({
          skipped: `Too short: ${article.title} (${
            cleanedContent ? cleanedContent.length : 0
          })`,
        })
      }

      if (
        (cleanedContent.length < 100 &&
          cleanedContent.includes('may refer to:')) ||
        cleanedContent.endsWith('may refer to:')
      ) {
        return parentPort.postMessage({
          skipped: `Too short: ${article.title} (${
            cleanedContent ? cleanedContent.length : 0
          })`,
        })
      }

      const slug = slugify(title)

      // Check if the article already exists.
      const dbCheckStartTime = Date.now()
      const existingArticleResult =
        await prisma.$queryRaw`SELECT "id" FROM "Article" WHERE "slug" = ${slug} LIMIT 1`
      const dbCheckEndTime = Date.now()
      const dbCheckTime = dbCheckEndTime - dbCheckStartTime

      if (existingArticleResult && existingArticleResult.length > 0) {
        return parentPort.postMessage({
          skipped: `Article already exists: ${title}`,
          dbCheckTime: dbCheckTime,
        })
      }

      const [titleVector, contentVector] = await Promise.all([
        generateEmbedding(article.title),
        generateEmbedding(cleanedContent),
      ])

      const titleVectorSql = pgvector.toSql(titleVector)
      const contentVectorSql = pgvector.toSql(contentVector)

      // Generate a unique ID for the article
      const articleId = createId()

      // Mark end of compute time and start of DB time
      const computeEndTime = Date.now()
      const computeTime = computeEndTime - startTime

      // Insert the new article.
      // const newArticle = await prisma.article.create({
      //   data: {
      //     title,
      //     content,
      //     slug,
      //     approved: true,
      //     needsApproval: false,
      //     approvedAt: new Date(),
      //     approvedBy: 'cmb50c2pc0000ocvwtyy4bxcu',
      //     published: true,
      //     authorId: 'cmb50c2pc0000ocvwtyy4bxcu',
      //     quickFacts: summary ? parseSummary(summary) : {},
      //   },
      // })

      // console.log("adding article")
      // console.log("title", title)
      // console.log("cleanedContent", cleanedContent.slice(0, 100 + "..."))
      // console.log("slug", slug)
      // console.log("parsedSummary", parsedSummary)

      const dbStartTime = Date.now()
      const newArticle = await prisma.$executeRaw`
        INSERT INTO "Article" (
          id, title, content, slug, approved, "needsApproval", "approvedAt", "approvedBy", 
          published, "authorId", "quickFacts", "titleVector", "contentVector", "vectorsGeneratedAt", 
          "createdAt", "updatedAt", "viewCount", "dailyViews", "lastViewReset", "isFeatured", 
          "sources", "talkContent"
        )
        VALUES (
          ${articleId}, ${title}, ${cleanedContent}, ${slug}, true, false, NOW(), 'cmb50c2pc0000ocvwtyy4bxcu', 
          true, 'cmb50c2pc0000ocvwtyy4bxcu', ${JSON.stringify(parsedSummary)}::jsonb, ${titleVectorSql}::vector, ${contentVectorSql}::vector, NOW(), 
          NOW(), NOW(), 0, 0, NOW(), false, 
          '', ''
        )
      `
      const dbEndTime = Date.now()
      const dbTime = dbEndTime - dbStartTime

      // console.log(newArticle)

      if (newArticle) {
        parentPort.postMessage({
          success: true,
          computeTime: computeTime,
          dbTime: dbTime,
          dbCheckTime: dbCheckTime,
        })
      } else {
        parentPort.postMessage({
          skipped: `Failed to create article: ${title}`,
        })
      }
    } catch (e) {
      parentPort.postMessage({
        error: e.message,
        stack: e.stack,
      })
    }
  })
}

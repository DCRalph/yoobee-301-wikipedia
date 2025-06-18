import { Worker, isMainThread, parentPort } from 'worker_threads'
import { PrismaClient } from '@prisma/client'

/////////////////////////////
// Configuration
/////////////////////////////

//1805697

const WORKER_COUNT = 32 // Number of worker threads.
const BATCH_SIZE = 100 // Number of articles to process per batch
const JOB_QUEUE_MAX = 500 // Maximum pending jobs before pausing retrieval

if (isMainThread) {
  /////////////////////////////
  // MAIN THREAD CODE
  /////////////////////////////

  // Progress counters
  let totalArticlesProcessed = 0
  let totalArticlesModified = 0
  let totalErrors = 0
  let totalArticles = 0

  // Set up a job queue and a flag to mark when all articles have been retrieved
  const jobQueue = []
  let retrievalFinished = false
  let fetchPaused = false
  let lastId = 0 // Cursor for pagination

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
      } else if (msg.modified) {
        totalArticlesModified++
      } else if (msg.processed) {
        totalArticlesProcessed++
      } else if (msg.message) {
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

    // Resume fetching if queue has space and we're not finished
    if (
      jobQueue.length < JOB_QUEUE_MAX - 10 &&
      !retrievalFinished &&
      fetchPaused
    ) {
      fetchPaused = false
      continueFetching()
    }

    // If retrieval is finished, the job queue is empty, and all workers are free, finish.
    if (
      retrievalFinished &&
      jobQueue.length === 0 &&
      workers.every((w) => !w.busy)
    ) {
      console.log('All articles processed. Exiting.')
      process.exit(0)
    }
  }

  const prisma = new PrismaClient()

  // Function to fetch articles from the database in batches
  async function fetchAndQueueArticles() {
    try {
      // Get total count of articles for progress tracking
      totalArticles = await prisma.article.count()
      console.log(`Found ${totalArticles} articles to process`)

      await continueFetching()
    } catch (error) {
      console.error('Error fetching articles:', error)
      process.exit(1)
    }
  }

  // Function to continue fetching articles using cursor-based pagination
  async function continueFetching() {
    try {
      while (!fetchPaused) {
        // Check if queue is full, pause if needed
        if (jobQueue.length >= JOB_QUEUE_MAX) {
          fetchPaused = true
          return
        }

        const articles = await prisma.article.findMany({
          select: {
            id: true,
            content: true,
          },
          where: {
            id: {
              gt: lastId, // Get articles with ID greater than lastId
            },
          },
          orderBy: {
            id: 'asc',
          },
          take: BATCH_SIZE,
        })

        if (articles.length === 0) {
          retrievalFinished = true
          console.log('Finished retrieving all articles from database')
          dispatchJobs()
          break
        }

        // Add articles to job queue
        for (const article of articles) {
          jobQueue.push(article)
        }

        // Update cursor to the last article's ID
        lastId = articles[articles.length - 1].id

        // Dispatch jobs after each batch is queued
        dispatchJobs()
      }
    } catch (error) {
      console.error('Error in continueFetching:', error)
      process.exit(1)
    }
  }

  // Start fetching articles
  fetchAndQueueArticles()

  // Periodically log overall progress
  const progressInterval = setInterval(() => {
    const busyWorkers = workers.filter((w) => w.busy).length
    const percentComplete = totalArticles
      ? ((totalArticlesProcessed / totalArticles) * 100).toFixed(2)
      : 0

    console.log(`Progress Update:
  Articles processed:      ${totalArticlesProcessed}/${totalArticles} (${percentComplete}%)
  Articles modified:       ${totalArticlesModified}
  Errors:                  ${totalErrors}
  Jobs queued:             ${jobQueue.length}
  Workers busy:            ${busyWorkers}
  `)
  }, 1000)

  process.on('exit', async () => {
    clearInterval(progressInterval)
    await prisma.$disconnect()
  })
} else {
  /////////////////////////////
  // WORKER THREAD CODE
  /////////////////////////////

  const prisma = new PrismaClient()

  parentPort.on('message', async (article) => {
    try {
      const pattern = /^:::summary\s*:::\s*\n\s*# /
      const content = article.content

      if (pattern.test(content)) {
        // Remove the pattern from the content
        const newContent = content.replace(pattern, '# ')

        // Update the article in the database
        await prisma.article.update({
          where: { id: article.id },
          data: { content: newContent },
        })

        parentPort.postMessage({
          modified: true,
          articleId: article.id,
        })
      } else {
        parentPort.postMessage({
          processed: true,
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
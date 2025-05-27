# Wikipedia-style App with AI Summaries

## AI Summary Feature

This application now includes advanced AI summaries powered by OpenAI's GPT models. To use this feature:

1. Sign up for an OpenAI API key at https://platform.openai.com/
2. Create a `.env.local` file in the root of the project
3. Add your API key to the file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Restart the development server

If the API key is not available or there's an error with the OpenAI service, the application will automatically fall back to a basic summary algorithm.


# Live: [wiki.w-g.co](https://wiki.w-g.co)

## Stats

Progress Update:
Lines processed: 18410541
Success: 5839351 + 400000 + 30699
Skipped (length): 11740192 
Skipped (already exists):30699
Skipped (other): 0
Errors: 185
Jobs queued: 83
Workers busy: 32
File read: 99%
Bytes read: 62.5784 GB
Total size: 62.5792 GB

- **18 Million articles downloaded**
- **6.2 Million after filtering**
- **19Gb in postgress**

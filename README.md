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

## Summary Level Options

The summary generator supports three levels of comprehension:

- **Novice**: Simple overview with basic vocabulary
- **Intermediate**: Balanced summary with moderate technical details
- **Advanced**: Comprehensive technical analysis with in-depth explanations

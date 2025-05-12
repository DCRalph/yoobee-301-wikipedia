import { type DiffResult } from "./diff-utils";
import { env } from "~/env";
import OpenAI from "openai";
import { db } from "~/server/db";

// Define the response interface for the AI moderation
export type ModerationResult = {
  isUseful: boolean;
  error: string | null;
  reason: string;
  factual_accuracy_and_relevance: string;
  coherence_and_readability: string;
  substance: string;
  contribution_value: string;
  score: number;
}

export async function moderateContent(content: string, diff: DiffResult): Promise<ModerationResult> {
  // Check if AI features are enabled in settings
  const setting = await db.setting.findFirst();
  if (!setting?.enableAIFeatures) {
    return { isUseful: false, error: "AI moderation skipped", reason: "", factual_accuracy_and_relevance: "", coherence_and_readability: "", substance: "", contribution_value: "", score: 0 };
  }

  // Check if API key is available
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OpenAI API key not found. Skipping content moderation.");
    return { isUseful: false, error: "API key not found", reason: "", factual_accuracy_and_relevance: "", coherence_and_readability: "", substance: "", contribution_value: "", score: 0 };
  }

  try {
    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey,
    });

    // Extract relevant information from the diff
    const { stats } = diff;
    const diffSummary = `Content changes: ${stats.additions} additions, ${stats.deletions} deletions, ${stats.unchanged} unchanged`;

    // Prepare prompt for OpenAI
    const prompt = `
Review the following content to determine if it contains useful and meaningful information.
Evaluate based on:
1. Factual accuracy and relevance
2. Coherence and readability
3. Substance (not placeholder text, spam, or gibberish)
4. Contribution value to a wiki-style knowledge base

Content to review:
${content}

Diff summary: ${diffSummary}

IMPORTANT: Respond with a JSON object in the following strict format:
{
  "isUseful": boolean, // true if the content should be approved, false if it should be rejected
  "reason": string, // brief explanation of your decision
  "factual_accuracy_and_relevance": string,
  "coherence_and_readability": string,
  "substance": string,
  "contribution_value": string,
  "score": number // overall quality score from 1-10
}
`;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "You are a content moderation assistant that evaluates whether content is useful and meaningful for a wiki-style application. Always respond with the requested JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    // Process the response
    const moderationText = response.choices[0]?.message.content ?? "";

    // Parse the JSON response
    try {
      const moderationResult = JSON.parse(moderationText) as ModerationResult;

      return moderationResult;
    } catch (error) {
      console.error("Failed to parse AI moderation response:", error);
      return { isUseful: false, error: "Error parsing moderation response", reason: "", factual_accuracy_and_relevance: "", coherence_and_readability: "", substance: "", contribution_value: "", score: 0 };
    }
  } catch (error) {
    console.error("Error in AI content moderation:", error);
    // Fail open - allow content if AI moderation fails
    return { isUseful: false, error: "Error during moderation", reason: "", factual_accuracy_and_relevance: "", coherence_and_readability: "", substance: "", contribution_value: "", score: 0 };
  }
}
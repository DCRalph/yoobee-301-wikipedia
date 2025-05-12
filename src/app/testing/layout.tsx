import React from "react";
import { db } from "~/server/db";
import { AIDisabledMessage } from "./ai-disabled-message";

export const metadata = {
  title: "Testing AI Features",
  description: "Test the AI capabilities of the application",
};

export default async function TestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if AI features are enabled in settings
  const setting = await db.setting.findFirst();
  const isAIEnabled = !!setting?.enableAIFeatures;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">AI Feature Testing</h1>

      {isAIEnabled ? (
        children
      ) : (
        <AIDisabledMessage />
      )}
    </div>
  );
} 
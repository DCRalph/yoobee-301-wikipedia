"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export function AIDisabledMessage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
      <div className="flex items-center text-yellow-500">
        <AlertCircle className="mr-2 h-8 w-8" />
        <h1 className="text-3xl font-bold">AI Features Disabled</h1>
      </div>

      <p className="text-xl text-muted-foreground">
        AI features are currently disabled. Donate so we can enable them.
      </p>

      <Button asChild variant="outline" className="mt-4">
        <Link href="/">
          Return Home
        </Link>
      </Button>
    </div>
  );
} 
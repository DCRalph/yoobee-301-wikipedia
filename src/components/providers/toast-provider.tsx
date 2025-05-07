"use client";

import { useTheme } from "next-themes";
import { Toaster } from "~/components/ui/sonner";

export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      richColors
      theme={theme == "dark" ? "dark" : "light"}
    />
  );
}

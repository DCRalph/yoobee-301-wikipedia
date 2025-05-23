import * as React from "react";

import { cn } from "~/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-accent text-foreground border-border border",
        "placeholder:text-muted-foreground",
        "focus-visible:ring-ring focus-visible:border-ring focus-visible:ring-2",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "hover:bg-accent/30",
        "flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-sm shadow-xs transition-colors duration-150 outline-none",
        "selection:bg-accent selection:text-accent-foreground",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

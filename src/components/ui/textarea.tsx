"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border bg-glass-bg/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 focus-visible:shadow-[0_0_15px_rgba(108,92,231,0.15)] disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          error
            ? "border-destructive/50 focus-visible:ring-destructive/50 focus-visible:border-destructive/50 focus-visible:shadow-[0_0_15px_rgba(255,71,87,0.15)]"
            : "border-border hover:border-primary/30",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };

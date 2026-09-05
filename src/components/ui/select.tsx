"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error = false, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-lg border bg-glass-bg/50 pl-4 pr-10 py-2.5 text-sm text-foreground backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 focus-visible:shadow-[0_0_15px_rgba(108,92,231,0.15)] disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-destructive/50 focus-visible:ring-destructive/50"
              : "border-border hover:border-primary/30",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };

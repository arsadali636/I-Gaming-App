"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "shrink-0 bg-gradient-to-r from-transparent via-border to-transparent",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px bg-gradient-to-b from-transparent via-border to-transparent",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };

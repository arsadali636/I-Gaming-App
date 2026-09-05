"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/15 text-primary",
        secondary:
          "border-secondary/30 bg-secondary/15 text-secondary",
        outline:
          "border-border text-muted-foreground",
        success:
          "border-accent/30 bg-accent/15 text-accent",
        warning:
          "border-yellow-500/30 bg-yellow-500/15 text-yellow-400",
        destructive:
          "border-destructive/30 bg-destructive/15 text-destructive",
        verified:
          "border-accent/30 bg-accent/15 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {variant === "verified" && (
        <Check className="mr-1 h-3 w-3" />
      )}
      {props.children}
    </div>
  );
}

export { Badge, badgeVariants };

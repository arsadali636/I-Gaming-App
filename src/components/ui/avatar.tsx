"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "default" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

function Avatar({ src, alt = "", fallback, size = "default", className, ...props }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const initials = fallback ? getInitials(fallback) : "??";
  const showImage = src && !imgError;

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-border",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground font-medium">
          {initials}
        </div>
      )}
    </div>
  );
}

export { Avatar };
export type { AvatarProps };

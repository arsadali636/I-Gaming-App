"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090B14] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:scale-[0.98]",
        secondary:
          "bg-[#111522] text-[#F8FAFC] border border-[#252A3A] hover:bg-[#171B2B] hover:border-[#343B52] active:scale-[0.98]",
        outline:
          "border border-[#252A3A] bg-transparent text-[#F8FAFC] hover:bg-[#171B2B] hover:border-[#343B52] active:scale-[0.98]",
        ghost:
          "text-[#A1A9B8] hover:bg-[#171B2B] hover:text-[#F8FAFC] active:scale-[0.98]",
        destructive:
          "bg-[#EF4444] text-white hover:bg-[#DC2626] active:scale-[0.98]",
        glow:
          "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:scale-[0.98]",
        gradient:
          "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        default: "h-10 px-5 py-2",
        lg: "h-12 px-8 text-base rounded-xl",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };


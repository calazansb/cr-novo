import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover hover:shadow",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
        success: "border-transparent bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow",
        warning: "border-transparent bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow",
        info: "border-transparent bg-info text-info-foreground shadow-sm hover:bg-info/90 hover:shadow",
        purple: "border-transparent bg-purple text-purple-foreground shadow-sm hover:bg-purple/90 hover:shadow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

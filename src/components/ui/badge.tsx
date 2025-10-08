import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-[0_2px_4px_hsl(var(--primary)/0.15),0_4px_8px_hsl(var(--primary)/0.1)] hover:bg-primary-hover hover:shadow-[0_4px_6px_hsl(var(--primary)/0.2),0_6px_12px_hsl(var(--primary)/0.15)] hover:-translate-y-0.5",
        secondary: "border-transparent bg-secondary text-secondary-foreground shadow-[0_2px_4px_hsl(var(--primary)/0.08),0_4px_8px_hsl(var(--primary)/0.05)] hover:bg-secondary-hover hover:shadow-[0_4px_6px_hsl(var(--primary)/0.12),0_6px_12px_hsl(var(--primary)/0.08)] hover:-translate-y-0.5",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-[0_2px_4px_hsl(var(--destructive)/0.15),0_4px_8px_hsl(var(--destructive)/0.1)] hover:bg-destructive/90 hover:shadow-[0_4px_6px_hsl(var(--destructive)/0.2),0_6px_12px_hsl(var(--destructive)/0.15)] hover:-translate-y-0.5",
        outline: "text-foreground border-border shadow-[0_1px_2px_hsl(var(--primary)/0.05)] hover:bg-accent hover:text-accent-foreground hover:shadow-[0_2px_4px_hsl(var(--primary)/0.1)] hover:-translate-y-0.5",
        success: "border-transparent bg-success text-success-foreground shadow-[0_2px_4px_hsl(var(--success)/0.15),0_4px_8px_hsl(var(--success)/0.1)] hover:bg-success/90 hover:shadow-[0_4px_6px_hsl(var(--success)/0.2),0_6px_12px_hsl(var(--success)/0.15)] hover:-translate-y-0.5",
        warning: "border-transparent bg-warning text-warning-foreground shadow-[0_2px_4px_hsl(var(--warning)/0.15),0_4px_8px_hsl(var(--warning)/0.1)] hover:bg-warning/90 hover:shadow-[0_4px_6px_hsl(var(--warning)/0.2),0_6px_12px_hsl(var(--warning)/0.15)] hover:-translate-y-0.5",
        info: "border-transparent bg-info text-info-foreground shadow-[0_2px_4px_hsl(var(--info)/0.15),0_4px_8px_hsl(var(--info)/0.1)] hover:bg-info/90 hover:shadow-[0_4px_6px_hsl(var(--info)/0.2),0_6px_12px_hsl(var(--info)/0.15)] hover:-translate-y-0.5",
        purple: "border-transparent bg-purple text-purple-foreground shadow-[0_2px_4px_hsl(var(--purple)/0.15),0_4px_8px_hsl(var(--purple)/0.1)] hover:bg-purple/90 hover:shadow-[0_4px_6px_hsl(var(--purple)/0.2),0_6px_12px_hsl(var(--purple)/0.15)] hover:-translate-y-0.5",
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

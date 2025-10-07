import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModernNavigationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: string;
  isActive?: boolean;
  onClick?: () => void;
  gradient?: string;
  stats?: {
    count: number;
    label: string;
  };
}

const colorVariants = {
  primary: {
    gradient: "from-blue-500/10 via-blue-400/5 to-transparent",
    border: "border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600",
    iconBg: "bg-gradient-to-br from-blue-600 to-blue-700",
    iconContainer: "bg-blue-100 dark:bg-blue-950",
    glow: "hover:shadow-[0_8px_30px_rgb(59,130,246,0.35)]",
    textHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400"
  },
  accent: {
    gradient: "from-purple-500/10 via-purple-400/5 to-transparent", 
    border: "border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600",
    iconBg: "bg-gradient-to-br from-purple-600 to-purple-700",
    iconContainer: "bg-purple-100 dark:bg-purple-950",
    glow: "hover:shadow-[0_8px_30px_rgb(168,85,247,0.35)]",
    textHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400"
  },
  secondary: {
    gradient: "from-slate-500/10 via-slate-400/5 to-transparent",
    border: "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600",
    iconBg: "bg-gradient-to-br from-slate-600 to-slate-700",
    iconContainer: "bg-slate-100 dark:bg-slate-950",
    glow: "hover:shadow-[0_8px_30px_rgb(100,116,139,0.35)]",
    textHover: "group-hover:text-slate-600 dark:group-hover:text-slate-400"
  },
  purple: {
    gradient: "from-violet-500/10 via-violet-400/5 to-transparent",
    border: "border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600", 
    iconBg: "bg-gradient-to-br from-violet-600 to-violet-700",
    iconContainer: "bg-violet-100 dark:bg-violet-950",
    glow: "hover:shadow-[0_8px_30px_rgb(139,92,246,0.35)]",
    textHover: "group-hover:text-violet-600 dark:group-hover:text-violet-400"
  },
  warning: {
    gradient: "from-amber-500/10 via-amber-400/5 to-transparent",
    border: "border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600",
    iconBg: "bg-gradient-to-br from-amber-600 to-amber-700",
    iconContainer: "bg-amber-100 dark:bg-amber-950", 
    glow: "hover:shadow-[0_8px_30px_rgb(245,158,11,0.35)]",
    textHover: "group-hover:text-amber-600 dark:group-hover:text-amber-400"
  },
  success: {
    gradient: "from-emerald-500/10 via-emerald-400/5 to-transparent",
    border: "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600",
    iconBg: "bg-gradient-to-br from-emerald-600 to-emerald-700",
    iconContainer: "bg-emerald-100 dark:bg-emerald-950",
    glow: "hover:shadow-[0_8px_30px_rgb(16,185,129,0.35)]",
    textHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
  },
  destructive: {
    gradient: "from-red-500/10 via-red-400/5 to-transparent",
    border: "border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600",
    iconBg: "bg-gradient-to-br from-red-600 to-red-700",
    iconContainer: "bg-red-100 dark:bg-red-950",
    glow: "hover:shadow-[0_8px_30px_rgb(239,68,68,0.35)]",
    textHover: "group-hover:text-red-600 dark:group-hover:text-red-400"
  },
  teal: {
    gradient: "from-teal-500/10 via-teal-400/5 to-transparent",
    border: "border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600",
    iconBg: "bg-gradient-to-br from-teal-600 to-teal-700",
    iconContainer: "bg-teal-100 dark:bg-teal-950",
    glow: "hover:shadow-[0_8px_30px_rgb(20,184,166,0.35)]",
    textHover: "group-hover:text-teal-600 dark:group-hover:text-teal-400"
  },
  rose: {
    gradient: "from-rose-500/10 via-rose-400/5 to-transparent",
    border: "border-rose-200 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-600",
    iconBg: "bg-gradient-to-br from-rose-600 to-rose-700",
    iconContainer: "bg-rose-100 dark:bg-rose-950",
    glow: "hover:shadow-[0_8px_30px_rgb(244,63,94,0.35)]",
    textHover: "group-hover:text-rose-600 dark:group-hover:text-rose-400"
  }
} as const;

const ModernNavigationCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color = "primary",
  isActive = false,
  onClick,
  stats
}: ModernNavigationCardProps) => {
  const variant = colorVariants[color as keyof typeof colorVariants] || colorVariants.primary;

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-500 relative overflow-hidden",
        "bg-white dark:bg-slate-900 border-2",
        variant.border,
        variant.glow,
        "hover:scale-[1.03] hover:-translate-y-1",
        "shadow-md hover:shadow-2xl",
        isActive && "ring-2 ring-offset-2 ring-blue-500 scale-[1.02]"
      )}
      onClick={onClick}
    >
      {/* Background Gradient Overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        variant.gradient
      )} />
      
      {/* Animated Border Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between mb-4">
          {/* Icon Container - Rounded Square Style */}
          <div className={cn(
            "relative p-4 rounded-2xl transition-all duration-500",
            "group-hover:scale-110 group-hover:rotate-3",
            variant.iconContainer
          )}>
            <div className={cn(
              "absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500",
              variant.iconBg
            )} />
            <div className={cn(
              "relative p-3 rounded-xl",
              variant.iconBg
            )}>
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>
          
          {stats && (
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                {stats.count}
              </div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stats.label}
              </div>
            </div>
          )}
        </div>
        
        <CardTitle className={cn(
          "text-xl font-bold text-foreground transition-all duration-300",
          variant.textHover
        )}>
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative pt-0">
        <CardDescription className="text-sm text-muted-foreground leading-relaxed mb-5 min-h-[2.5rem]">
          {description}
        </CardDescription>
        
        <div className="flex items-center text-sm font-semibold text-primary group-hover:gap-2 transition-all duration-300">
          <span>Acessar</span>
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </CardContent>
      
      {/* Active Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-r-full shadow-[0_0_10px_rgb(59,130,246,0.5)]" />
      )}
      
      {/* Bottom Accent Line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1 transition-all duration-500",
        "bg-gradient-to-r opacity-0 group-hover:opacity-100",
        variant.iconBg
      )} />
    </Card>
  );
};

export default ModernNavigationCard;
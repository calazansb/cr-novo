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
    gradient: "from-primary/10 via-primary/5 to-transparent",
    border: "border-primary/20 hover:border-primary/40",
    icon: "text-primary bg-primary/10",
    glow: "hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
  },
  accent: {
    gradient: "from-accent/10 via-accent/5 to-transparent", 
    border: "border-accent/20 hover:border-accent/40",
    icon: "text-accent-foreground bg-accent/10",
    glow: "hover:shadow-[0_0_30px_hsl(var(--accent)/0.3)]"
  },
  secondary: {
    gradient: "from-muted/50 via-muted/25 to-transparent",
    border: "border-border/50 hover:border-border",
    icon: "text-foreground bg-muted/50",
    glow: "hover:shadow-elevated"
  },
  purple: {
    gradient: "from-purple/10 via-purple/5 to-transparent",
    border: "border-purple/20 hover:border-purple/40", 
    icon: "text-purple bg-purple/10",
    glow: "hover:shadow-[0_0_30px_hsl(var(--purple)/0.3)]"
  },
  warning: {
    gradient: "from-warning/10 via-warning/5 to-transparent",
    border: "border-warning/20 hover:border-warning/40",
    icon: "text-warning bg-warning/10", 
    glow: "hover:shadow-[0_0_30px_hsl(var(--warning)/0.3)]"
  },
  success: {
    gradient: "from-success/10 via-success/5 to-transparent",
    border: "border-success/20 hover:border-success/40",
    icon: "text-success bg-success/10",
    glow: "hover:shadow-[0_0_30px_hsl(var(--success)/0.3)]"
  },
  destructive: {
    gradient: "from-destructive/10 via-destructive/5 to-transparent",
    border: "border-destructive/20 hover:border-destructive/40",
    icon: "text-destructive bg-destructive/10",
    glow: "hover:shadow-[0_0_30px_hsl(var(--destructive)/0.3)]"
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
        "group cursor-pointer transition-all duration-300 hover-lift relative overflow-hidden",
        "bg-gradient-to-br", variant.gradient,
        variant.border,
        variant.glow,
        isActive && "ring-2 ring-primary/50 shadow-glow scale-[1.02]"
      )}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Floating Orb Effect */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between">
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
            variant.icon
          )}>
            <Icon className="w-6 h-6" />
          </div>
          
          {stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{stats.count}</div>
              <div className="text-xs text-muted-foreground">{stats.label}</div>
            </div>
          )}
        </div>
        
        <CardTitle className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative pt-0">
        <CardDescription className="text-sm text-muted-foreground leading-relaxed mb-4">
          {description}
        </CardDescription>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
        >
          Acessar
        </Button>
      </CardContent>
      
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-primary via-primary-glow to-primary rounded-r-full" />
      )}
    </Card>
  );
};

export default ModernNavigationCard;
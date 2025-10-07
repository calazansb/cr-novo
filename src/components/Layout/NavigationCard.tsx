import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
interface NavigationCardProps {
  title: string;
  description: string;
  icon: LucideIcon | React.ComponentType<any>;
  isActive?: boolean;
  onClick: () => void;
  color: "primary" | "warning" | "success" | "destructive" | "secondary" | "accent" | "purple";
}
const colorVariants = {
  primary: "from-primary/10 to-primary/5 border-primary/20 hover:border-primary/30",
  warning: "from-warning/10 to-warning/5 border-warning/20 hover:border-warning/30",
  success: "from-success/10 to-success/5 border-success/20 hover:border-success/30",
  destructive: "from-destructive/10 to-destructive/5 border-destructive/20 hover:border-destructive/30",
  secondary: "from-secondary/10 to-secondary/5 border-secondary/20 hover:border-secondary/30",
  accent: "from-accent/10 to-accent/5 border-accent/20 hover:border-accent/30",
  purple: "from-purple/10 to-purple/5 border-purple/20 hover:border-purple/30"
};
const iconColors = {
  primary: "text-primary",
  warning: "text-warning",
  success: "text-success",
  destructive: "text-destructive",
  secondary: "text-secondary",
  accent: "text-accent",
  purple: "text-purple"
};
const NavigationCard = ({
  title,
  description,
  icon: Icon,
  isActive,
  onClick,
  color
}: NavigationCardProps) => {
  return <Card className={`
        cursor-pointer transition-all duration-300 hover:shadow-elevated
        bg-gradient-to-br ${colorVariants[color]}
        ${isActive ? 'ring-2 ring-primary shadow-elevated' : ''}
        animate-slide-up
      `} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-card rounded-lg shadow-card">
            {Icon.toString().includes('img') ? <div className="h-8 w-8 flex items-center justify-center">
                <Icon />
              </div> : <Icon className={`h-8 w-8 ${iconColors[color]}`} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-card-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm font-medium">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default NavigationCard;
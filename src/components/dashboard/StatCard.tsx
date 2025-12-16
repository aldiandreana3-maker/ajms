import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "accent" | "info" | "warning";
  dataType?: "admin" | "user"; // admin = red circle, user = blue circle
  delay?: number;
}

const variantStyles = {
  default: "bg-card border-border",
  primary: "bg-primary/5 border-primary/20",
  accent: "bg-success-light border-success/20",
  info: "bg-info-light border-info/20",
  warning: "bg-warning-light border-warning/20",
};

const iconStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary text-primary-foreground",
  accent: "bg-success text-success-light",
  info: "bg-info text-info-light",
  warning: "bg-warning text-warning-light",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  dataType = "user",
  delay = 0,
}: StatCardProps) {
  const circleColorClass = dataType === "admin" 
    ? "ring-2 ring-admin-red" 
    : "ring-2 ring-user-blue";

  return (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up",
        variantStyles[variant]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center bg-card",
            circleColorClass
          )}>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "+" : "-"}{trend.value}% dari bulan lalu
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "card" | "text" | "avatar" | "badge";
}

export const Skeleton = ({ className, variant = "default" }: SkeletonProps) => {
  const baseClasses = "animate-pulse bg-muted rounded";
  
  const variantClasses = {
    default: "h-4 w-full",
    card: "h-32 w-full",
    text: "h-4 w-3/4",
    avatar: "h-10 w-10 rounded-full",
    badge: "h-6 w-20 rounded-full",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      aria-label="Carregando..."
      role="status"
    />
  );
};

// Skeleton para cards de estatísticas
export const StatsCardSkeleton = () => (
  <div className="p-4 gradient-card border-border/50 shadow-card space-y-3">
    <Skeleton variant="avatar" className="h-5 w-5" />
    <Skeleton variant="text" className="h-3 w-20" />
    <Skeleton variant="default" className="h-6 w-12" />
    <Skeleton variant="text" className="h-2 w-24" />
  </div>
);

// Skeleton para lista de treinos
export const TreinoCardSkeleton = () => (
  <div className="p-4 gradient-card border-border/50 shadow-card">
    <div className="flex items-start gap-3">
      <Skeleton variant="avatar" className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="default" className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="text" className="h-8 w-16" />
          <Skeleton variant="text" className="h-8 w-16" />
        </div>
      </div>
    </div>
  </div>
);

// Skeleton para grid de badges
export const BadgeCardSkeleton = () => (
  <div className="p-4 gradient-card border-2 border-border/30 text-center space-y-2">
    <Skeleton variant="avatar" className="h-12 w-12 mx-auto rounded-full" />
    <Skeleton variant="default" className="h-4 w-24 mx-auto" />
    <Skeleton variant="text" className="h-3 w-32 mx-auto" />
    <Skeleton variant="badge" className="mx-auto" />
  </div>
);

// Skeleton para gráficos
export const ChartSkeleton = () => (
  <div className="p-4 gradient-card border-border/50 shadow-card space-y-4">
    <Skeleton variant="default" className="h-6 w-32" />
    <div className="h-64 w-full space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton
          key={i}
          variant="default"
          className="h-full"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  </div>
);


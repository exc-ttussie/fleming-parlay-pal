import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ 
  className, 
  message = "Loading...", 
  size = "md" 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <div className={cn(
        "animate-spin rounded-full border-b-2 border-primary mb-4",
        sizeClasses[size]
      )} />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  className?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ 
  className, 
  message, 
  onRetry, 
  retryLabel = "Try Again" 
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
      <div className="text-destructive mb-2">⚠️</div>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
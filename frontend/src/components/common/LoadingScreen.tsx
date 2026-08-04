import { Skeleton } from "@/components/ui/Skeleton";

interface LoadingScreenProps {
  label?: string;
}

export function LoadingScreen({ label = "Loading workspace..." }: LoadingScreenProps) {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-4">
        <p className="text-sm text-muted-foreground" role="status">
          {label}
        </p>
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-72 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </main>
  );
}

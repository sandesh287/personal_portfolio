import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

function Fallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section className="max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold">Something went wrong.</h1>
        <p className="text-sm text-muted-foreground">
          The workspace could not render this view. Please refresh and try again.
        </p>
      </section>
    </main>
  );
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary FallbackComponent={Fallback}>{children}</ErrorBoundary>;
}

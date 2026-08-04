import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export function Toolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2",
        className,
      )}
      {...props}
    />
  );
}

export function ToolbarGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}

import type { HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export function FormActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

import type { SelectHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export function SelectField({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none",
        "focus:border-primary focus:ring-2 focus:ring-primary/20",
        className,
      )}
      {...props}
    />
  );
}

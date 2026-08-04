import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ className, hasError = false, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-28 rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors",
        "placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
        hasError ? "border-destructive" : "border-border",
        className,
      )}
      {...props}
    />
  );
}

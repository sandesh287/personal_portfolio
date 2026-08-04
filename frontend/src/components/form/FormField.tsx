import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

interface FormFieldProps {
  label: string;
  error?: string;
  description?: string;
  children: ReactNode;
}

export function FormField({ label, error, description, children }: FormFieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function TextInput({ className, hasError = false, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        "h-10 rounded-md border bg-background px-3 text-sm text-foreground outline-none transition-colors",
        "placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
        hasError ? "border-destructive" : "border-border",
        className,
      )}
      {...props}
    />
  );
}

import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

interface WindowProps extends HTMLAttributes<HTMLElement> {
  title: string;
  actions?: ReactNode;
}

export function Window({ title, actions, children, className, ...props }: WindowProps) {
  return (
    <section
      className={cn("overflow-hidden rounded-md border border-border bg-surface text-foreground", className)}
      {...props}
    >
      <header className="flex h-11 items-center justify-between gap-3 border-b border-border px-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <h2 className="ml-2 text-sm font-medium">{title}</h2>
        </div>
        {actions}
      </header>
      <div>{children}</div>
    </section>
  );
}

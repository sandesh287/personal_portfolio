import type { ReactNode } from "react";
import { NavLink } from "react-router";

import type { NavigationItem } from "@/constants/navigation";
import { cn } from "@/utils/cn";

interface SidebarProps {
  title: string;
  subtitle?: string;
  items: NavigationItem[];
  footer?: ReactNode;
}

export function Sidebar({ title, subtitle, items, footer }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <header className="border-b border-border p-4">
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
      </header>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/admin" || item.href === "/"}
            className={({ isActive }) =>
              cn(
                "flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {footer ? <footer className="border-t border-border p-3">{footer}</footer> : null}
    </aside>
  );
}

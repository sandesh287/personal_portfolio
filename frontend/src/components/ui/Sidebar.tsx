import type { ReactNode } from "react";
import { useEffect } from "react";
import { NavLink } from "react-router";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { NavigationItem } from "@/constants/navigation";
import { cn } from "@/utils/cn";

interface SidebarProps {
  title: string;
  subtitle?: string;
  items: NavigationItem[];
  footer?: ReactNode;
  className?: string;
  onNavigate?: () => void;
  badges?: Partial<Record<string, number>>;
}

export function Sidebar({
  title,
  subtitle,
  items,
  footer,
  className,
  onNavigate,
  badges,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar",
        className,
      )}
    >
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
            onClick={onNavigate}
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
            {badges?.[item.href] ? (
              <span
                className="ml-auto min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-destructive-foreground"
                aria-label={`${badges[item.href]} unread messages`}
              >
                {badges[item.href]! > 99 ? "99+" : badges[item.href]}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>
      {footer ? <footer className="border-t border-border p-3">{footer}</footer> : null}
    </aside>
  );
}

interface SidebarDrawerProps extends Omit<SidebarProps, "className" | "onNavigate"> {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarDrawer({ isOpen, onClose, ...sidebarProps }: SidebarDrawerProps) {
  useEffect(() => {
    if (!isOpen) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <div className="relative h-full w-64 max-w-[85vw] shadow-xl">
        <Sidebar {...sidebarProps} className="w-full" onNavigate={onClose} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
          onClick={onClose}
        >
          Close navigation
        </Button>
      </div>
    </div>
  );
}

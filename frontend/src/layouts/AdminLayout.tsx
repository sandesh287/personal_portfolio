import { Outlet } from "react-router";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Sidebar } from "@/components/ui/Sidebar";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
import { adminNavigation } from "@/constants/navigation";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar title="Admin" subtitle="Content Control" items={adminNavigation} />
      <main className="flex min-w-0 flex-1 flex-col">
        <Toolbar>
          <ToolbarGroup>
            <span className="text-sm font-medium">Admin Dashboard</span>
            <span className="text-xs text-muted-foreground">Protected workspace</span>
          </ToolbarGroup>
          <ToolbarGroup>
            <ThemeToggle />
          </ToolbarGroup>
        </Toolbar>
        <div className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

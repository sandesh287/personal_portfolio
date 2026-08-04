import { Outlet } from "react-router";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Sidebar } from "@/components/ui/Sidebar";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
import { Window } from "@/components/ui/Window";
import { workspaceNavigation } from "@/constants/navigation";

export function WorkspaceLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar title="Sandesh" subtitle="Developer Workspace" items={workspaceNavigation} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar>
          <ToolbarGroup>
            <span className="text-sm font-medium">Portfolio OS</span>
            <span className="text-xs text-muted-foreground">Public workspace</span>
          </ToolbarGroup>
          <ToolbarGroup>
            <ThemeToggle />
          </ToolbarGroup>
        </Toolbar>
        <div className="flex-1 overflow-y-auto p-4">
          <Window title="workspace">
            <Outlet />
          </Window>
        </div>
      </div>
    </div>
  );
}

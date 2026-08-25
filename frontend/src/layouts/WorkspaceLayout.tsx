import { Outlet } from "react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Sidebar, SidebarDrawer } from "@/components/ui/Sidebar";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
import { Window } from "@/components/ui/Window";
import { workspaceNavigation } from "@/constants/navigation";

export function WorkspaceLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        title="Sandesh Panthee"
        subtitle="Developer Workspace"
        items={workspaceNavigation}
        className="hidden lg:flex"
      />
      <SidebarDrawer
        title="Sandesh Panthee"
        subtitle="Developer Workspace"
        items={workspaceNavigation}
        isOpen={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar>
          <ToolbarGroup className="min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              leftIcon={<Menu className="h-5 w-5" aria-hidden="true" />}
              onClick={() => setIsNavigationOpen(true)}
            >
              Open navigation
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Portfolio OS</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Public workspace</p>
            </div>
          </ToolbarGroup>
          <ToolbarGroup>
            <ThemeToggle />
          </ToolbarGroup>
        </Toolbar>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Window title="workspace">
            <Outlet />
          </Window>
        </div>
      </div>
    </div>
  );
}

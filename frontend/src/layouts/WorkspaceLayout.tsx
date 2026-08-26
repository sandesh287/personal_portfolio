import { Outlet } from "react-router";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Sidebar, SidebarDrawer } from "@/components/ui/Sidebar";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
import { Window } from "@/components/ui/Window";
import { workspaceNavigation } from "@/constants/navigation";
import { routes } from "@/constants/routes";
import { usePublicSettings } from "@/features/settings";

export function WorkspaceLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const settings = usePublicSettings();
  const profileName = settings.data?.profileName ?? "Sandesh Panthee";
  const profileRole = settings.data?.profileRole ?? "Developer Workspace";
  const navigationItems =
    settings.data?.resumeEnabled === false
      ? workspaceNavigation.filter((item) => item.href !== routes.resume)
      : workspaceNavigation;

  useEffect(() => {
    if (!settings.data) return;
    document.title = settings.data.siteTitle;
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", settings.data.seoDescription);
    document
      .querySelector<HTMLMetaElement>('meta[name="robots"]')
      ?.setAttribute(
        "content",
        settings.data.searchEngineIndexing ? "index, follow" : "noindex, nofollow",
      );
  }, [settings.data]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        title={profileName}
        subtitle={profileRole}
        items={navigationItems}
        className="hidden lg:flex"
      />
      <SidebarDrawer
        title={profileName}
        subtitle={profileRole}
        items={navigationItems}
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

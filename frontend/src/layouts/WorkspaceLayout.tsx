import { Outlet, useLocation } from "react-router";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SeoMetadata } from "@/components/common/SeoMetadata";
import { Button } from "@/components/ui/Button";
import { Sidebar, SidebarDrawer } from "@/components/ui/Sidebar";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
import { Window } from "@/components/ui/Window";
import { workspaceNavigation } from "@/constants/navigation";
import { usePublicSettings } from "@/features/settings";
import { AnalyticsTracker } from "@/features/analytics/AnalyticsTracker";

export function WorkspaceLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const location = useLocation();
  const settings = usePublicSettings();
  const profileName = settings.data?.profileName ?? "Sandesh Panthee";
  const profileRole = settings.data?.profileRole ?? "Developer Workspace";
  const navigationItems = workspaceNavigation.filter((item) => {
    if (!item.visibilitySetting) return true;
    if (!settings.data) return item.visibilitySetting !== "navigationFlutterLabVisible";
    return settings.data[item.visibilitySetting];
  });
  const routeMetadata = getRouteMetadata(location.pathname, settings.data?.profileName);
  const hasPageMetadata =
    location.pathname.startsWith("/projects/") || location.pathname.startsWith("/blog/");

  useEffect(() => {
    if (!settings.data) return;
    document
      .querySelector<HTMLMetaElement>('meta[name="robots"]')
      ?.setAttribute(
        "content",
        settings.data.searchEngineIndexing ? "index, follow" : "noindex, nofollow",
      );
  }, [settings.data]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AnalyticsTracker />
      {!hasPageMetadata ? (
        <SeoMetadata
          title={`${routeMetadata.title} | ${settings.data?.siteTitle ?? "Sandesh Developer Workspace"}`}
          description={
            routeMetadata.description ??
            settings.data?.seoDescription ??
            "Sandesh's software development portfolio and engineering notes."
          }
          path={location.pathname}
          image={settings.data?.profileImageUrl}
          siteName={settings.data?.siteTitle}
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: settings.data?.profileName ?? "Sandesh Panthee",
            url: window.location.origin,
            jobTitle: settings.data?.profileRole ?? "Software Developer",
          }}
        />
      ) : null}
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

function getRouteMetadata(pathname: string, profileName = "Sandesh") {
  if (pathname.startsWith("/projects/")) return { title: "Project", description: undefined };
  if (pathname.startsWith("/blog/")) return { title: "Engineering Note", description: undefined };
  const routesByPath: Record<string, { title: string; description?: string }> = {
    "/": {
      title: profileName,
      description: "React, Flutter, and data science portfolio workspace.",
    },
    "/profile": { title: "Developer Profile" },
    "/projects": { title: "Projects Explorer" },
    "/ai-lab": { title: "AI Lab" },
    "/flutter-lab": { title: "Flutter Device Lab" },
    "/blog": { title: "Engineering Notes" },
    "/resume": { title: "Resume" },
    "/github": { title: "GitHub Explorer" },
    "/skills": { title: "Skills Graph" },
    "/experience": { title: "Experience" },
    "/contact": { title: "Contact" },
  };
  return routesByPath[pathname] ?? { title: "Workspace" };
}

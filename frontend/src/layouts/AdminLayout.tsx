import { Outlet } from "react-router";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Sidebar, SidebarDrawer } from "@/components/ui/Sidebar";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
import { adminNavigation } from "@/constants/navigation";
import { routes } from "@/constants/routes";
import { useLogout } from "@/features/auth";
import { useUnreadMessageCount } from "@/features/messages";

export function AdminLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useLogout();
  const unreadMessages = useUnreadMessageCount();
  const navigationBadges = unreadMessages.data
    ? { [routes.adminMessages]: unreadMessages.data }
    : undefined;

  async function handleLogout() {
    await logout.mutateAsync();
    toast.success("Signed out.");
    navigate(routes.adminLogin, { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        title="Admin"
        subtitle="Content Control"
        items={adminNavigation}
        className="hidden lg:flex"
        badges={navigationBadges}
      />
      <SidebarDrawer
        title="Admin"
        subtitle="Content Control"
        items={adminNavigation}
        isOpen={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
        badges={navigationBadges}
      />
      <main className="flex min-w-0 flex-1 flex-col">
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
              <p className="truncate text-sm font-medium">Admin Dashboard</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Protected workspace</p>
            </div>
          </ToolbarGroup>
          <ToolbarGroup>
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />}
              onClick={() => void handleLogout()}
              isLoading={logout.isPending}
            >
              Sign out
            </Button>
          </ToolbarGroup>
        </Toolbar>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

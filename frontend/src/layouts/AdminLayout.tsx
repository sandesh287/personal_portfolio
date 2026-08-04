import { Outlet } from "react-router";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Sidebar } from "@/components/ui/Sidebar";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
import { adminNavigation } from "@/constants/navigation";
import { routes } from "@/constants/routes";
import { useLogout } from "@/features/auth";
import { useAuthStore } from "@/stores/authStore";

export function AdminLayout() {
  const navigate = useNavigate();
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useLogout();

  async function handleLogout() {
    if (!refreshToken) {
      navigate(routes.adminLogin, { replace: true });
      return;
    }

    await logout.mutateAsync({ refreshToken });
    toast.success("Signed out.");
    navigate(routes.adminLogin, { replace: true });
  }

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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void handleLogout()}
              isLoading={logout.isPending}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </ToolbarGroup>
        </Toolbar>
        <div className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <Outlet />
    </main>
  );
}

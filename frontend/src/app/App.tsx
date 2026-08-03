import { RouterProvider } from "react-router";

import { AppErrorBoundary } from "@/components/common/AppErrorBoundary";
import { AppProviders } from "@/providers/AppProviders";
import { router } from "@/routes/router";

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  );
}

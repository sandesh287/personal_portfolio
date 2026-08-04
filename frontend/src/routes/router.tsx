import { createBrowserRouter } from "react-router";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { ProjectDetailsPage } from "@/pages/projects/ProjectDetailsPage";
import { ProjectsPage } from "@/pages/projects/ProjectsPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        element: <WorkspaceLayout />,
        children: [
          { path: "/", element: <PlaceholderPage title="Landing Workspace" /> },
          { path: "/projects", element: <ProjectsPage /> },
          { path: "/projects/:slug", element: <ProjectDetailsPage /> },
          { path: "/blog", element: <PlaceholderPage title="Engineering Notes" /> },
          { path: "/blog/:slug", element: <PlaceholderPage title="Engineering Note" /> },
          { path: "/resume", element: <PlaceholderPage title="Resume Viewer" /> },
          { path: "/github", element: <PlaceholderPage title="GitHub Explorer" /> },
          { path: "/skills", element: <PlaceholderPage title="Skills Graph" /> },
          { path: "/experience", element: <PlaceholderPage title="Developer Profile" /> },
          { path: "/contact", element: <PlaceholderPage title="Communication Terminal" /> },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [{ path: "/admin/login", element: <PlaceholderPage title="Admin Login" /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <PlaceholderPage title="Admin Dashboard" /> },
          { path: "projects", element: <PlaceholderPage title="Projects Admin" /> },
          { path: "blog", element: <PlaceholderPage title="Blog Admin" /> },
          { path: "skills", element: <PlaceholderPage title="Skills Admin" /> },
          { path: "experience", element: <PlaceholderPage title="Experience Admin" /> },
          { path: "resume", element: <PlaceholderPage title="Resume Admin" /> },
          { path: "media", element: <PlaceholderPage title="Media Library" /> },
          { path: "messages", element: <PlaceholderPage title="Messages" /> },
          { path: "settings", element: <PlaceholderPage title="Settings" /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

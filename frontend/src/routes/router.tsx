import { lazy } from "react";
import { createBrowserRouter } from "react-router";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { LazyRoute } from "@/routes/LazyRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

const AdminLoginPage = lazy(() =>
  import("@/pages/admin/AdminLoginPage").then((module) => ({
    default: module.AdminLoginPage,
  })),
);

const AdminProjectsPage = lazy(() =>
  import("@/pages/admin/AdminProjectsPage").then((module) => ({
    default: module.AdminProjectsPage,
  })),
);

const AdminProjectCategoriesPage = lazy(() =>
  import("@/pages/admin/AdminProjectTaxonomyPage").then((module) => ({
    default: () => <module.AdminProjectTaxonomyPage mode="categories" />,
  })),
);

const AdminTechnologiesPage = lazy(() =>
  import("@/pages/admin/AdminProjectTaxonomyPage").then((module) => ({
    default: () => <module.AdminProjectTaxonomyPage mode="technologies" />,
  })),
);

const AdminMediaPage = lazy(() =>
  import("@/pages/admin/AdminMediaPage").then((module) => ({
    default: module.AdminMediaPage,
  })),
);

const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })),
);

const ProjectDetailsPage = lazy(() =>
  import("@/pages/projects/ProjectDetailsPage").then((module) => ({
    default: module.ProjectDetailsPage,
  })),
);

const ProjectsPage = lazy(() =>
  import("@/pages/projects/ProjectsPage").then((module) => ({ default: module.ProjectsPage })),
);

const BlogPage = lazy(() =>
  import("@/pages/blog/BlogPage").then((module) => ({ default: module.BlogPage })),
);

const BlogDetailsPage = lazy(() =>
  import("@/pages/blog/BlogDetailsPage").then((module) => ({
    default: module.BlogDetailsPage,
  })),
);

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        element: <WorkspaceLayout />,
        children: [
          { path: "/", element: <PlaceholderPage title="Landing Workspace" /> },
          { path: "/projects", element: <LazyRoute component={ProjectsPage} /> },
          { path: "/projects/:slug", element: <LazyRoute component={ProjectDetailsPage} /> },
          { path: "/blog", element: <LazyRoute component={BlogPage} /> },
          { path: "/blog/:slug", element: <LazyRoute component={BlogDetailsPage} /> },
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
    children: [{ path: "/admin/login", element: <LazyRoute component={AdminLoginPage} /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <PlaceholderPage title="Admin Dashboard" /> },
          { path: "projects", element: <LazyRoute component={AdminProjectsPage} /> },
          {
            path: "project-categories",
            element: <LazyRoute component={AdminProjectCategoriesPage} />,
          },
          {
            path: "technologies",
            element: <LazyRoute component={AdminTechnologiesPage} />,
          },
          { path: "blog", element: <PlaceholderPage title="Blog Admin" /> },
          { path: "skills", element: <PlaceholderPage title="Skills Admin" /> },
          { path: "experience", element: <PlaceholderPage title="Experience Admin" /> },
          { path: "resume", element: <PlaceholderPage title="Resume Admin" /> },
          { path: "media", element: <LazyRoute component={AdminMediaPage} /> },
          { path: "messages", element: <PlaceholderPage title="Messages" /> },
          { path: "settings", element: <PlaceholderPage title="Settings" /> },
        ],
      },
    ],
  },
  { path: "*", element: <LazyRoute component={NotFoundPage} /> },
]);

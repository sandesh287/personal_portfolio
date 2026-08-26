import { lazy } from "react";
import { createBrowserRouter } from "react-router";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { LazyRoute } from "@/routes/LazyRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

const AdminLoginPage = lazy(() =>
  import("@/pages/admin/AdminLoginPage").then((module) => ({
    default: module.AdminLoginPage,
  })),
);

const HomePage = lazy(() =>
  import("@/pages/home/HomePage").then((module) => ({ default: module.HomePage })),
);

const AdminDashboardPage = lazy(() =>
  import("@/pages/admin/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
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

const AdminBlogPage = lazy(() =>
  import("@/pages/admin/AdminBlogPage").then((module) => ({
    default: module.AdminBlogPage,
  })),
);

const AdminExperiencePage = lazy(() =>
  import("@/pages/admin/AdminExperiencePage").then((module) => ({
    default: module.AdminExperiencePage,
  })),
);

const ExperiencePage = lazy(() =>
  import("@/pages/experience/ExperiencePage").then((module) => ({
    default: module.ExperiencePage,
  })),
);

const SkillsPage = lazy(() =>
  import("@/pages/skills/SkillsPage").then((module) => ({ default: module.SkillsPage })),
);

const AdminSkillsPage = lazy(() =>
  import("@/pages/admin/AdminSkillsPage").then((module) => ({
    default: module.AdminSkillsPage,
  })),
);

const ResumePage = lazy(() =>
  import("@/pages/resume/ResumePage").then((module) => ({ default: module.ResumePage })),
);

const AdminResumePage = lazy(() =>
  import("@/pages/admin/AdminResumePage").then((module) => ({
    default: module.AdminResumePage,
  })),
);

const ContactPage = lazy(() =>
  import("@/pages/contact/ContactPage").then((module) => ({ default: module.ContactPage })),
);

const GitHubPage = lazy(() =>
  import("@/pages/github/GitHubPage").then((module) => ({ default: module.GitHubPage })),
);

const AdminMessagesPage = lazy(() =>
  import("@/pages/admin/AdminMessagesPage").then((module) => ({
    default: module.AdminMessagesPage,
  })),
);

const AdminSettingsPage = lazy(() =>
  import("@/pages/admin/AdminSettingsPage").then((module) => ({
    default: module.AdminSettingsPage,
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
          { path: "/", element: <LazyRoute component={HomePage} /> },
          { path: "/projects", element: <LazyRoute component={ProjectsPage} /> },
          { path: "/projects/:slug", element: <LazyRoute component={ProjectDetailsPage} /> },
          { path: "/blog", element: <LazyRoute component={BlogPage} /> },
          { path: "/blog/:slug", element: <LazyRoute component={BlogDetailsPage} /> },
          { path: "/resume", element: <LazyRoute component={ResumePage} /> },
          { path: "/github", element: <LazyRoute component={GitHubPage} /> },
          { path: "/skills", element: <LazyRoute component={SkillsPage} /> },
          { path: "/experience", element: <LazyRoute component={ExperiencePage} /> },
          { path: "/contact", element: <LazyRoute component={ContactPage} /> },
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
          { index: true, element: <LazyRoute component={AdminDashboardPage} /> },
          { path: "projects", element: <LazyRoute component={AdminProjectsPage} /> },
          {
            path: "project-categories",
            element: <LazyRoute component={AdminProjectCategoriesPage} />,
          },
          {
            path: "technologies",
            element: <LazyRoute component={AdminTechnologiesPage} />,
          },
          { path: "blog", element: <LazyRoute component={AdminBlogPage} /> },
          { path: "skills", element: <LazyRoute component={AdminSkillsPage} /> },
          { path: "experience", element: <LazyRoute component={AdminExperiencePage} /> },
          { path: "resume", element: <LazyRoute component={AdminResumePage} /> },
          { path: "media", element: <LazyRoute component={AdminMediaPage} /> },
          { path: "messages", element: <LazyRoute component={AdminMessagesPage} /> },
          { path: "settings", element: <LazyRoute component={AdminSettingsPage} /> },
        ],
      },
    ],
  },
  { path: "*", element: <LazyRoute component={NotFoundPage} /> },
]);

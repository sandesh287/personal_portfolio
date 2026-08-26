import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Code2,
  FileText,
  Github,
  Home,
  Mail,
  Newspaper,
  Settings,
  Smartphone,
  Sparkles,
  Tags,
  Upload,
  UserRound,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { routes } from "@/constants/routes";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  visibilitySetting?: NavigationVisibilitySetting;
}

export type NavigationVisibilitySetting =
  | "navigationProfileVisible"
  | "navigationProjectsVisible"
  | "navigationAiLabVisible"
  | "navigationFlutterLabVisible"
  | "navigationBlogVisible"
  | "resumeEnabled"
  | "navigationGithubVisible"
  | "navigationSkillsVisible"
  | "navigationExperienceVisible"
  | "navigationContactVisible";

export const workspaceNavigation: NavigationItem[] = [
  { label: "Workspace", href: routes.home, icon: Home },
  {
    label: "Profile",
    href: routes.profile,
    icon: UserRound,
    visibilitySetting: "navigationProfileVisible",
  },
  {
    label: "Projects",
    href: routes.projects,
    icon: Code2,
    visibilitySetting: "navigationProjectsVisible",
  },
  {
    label: "AI Lab",
    href: routes.aiLab,
    icon: BrainCircuit,
    visibilitySetting: "navigationAiLabVisible",
  },
  {
    label: "Device Lab",
    href: routes.flutterLab,
    icon: Smartphone,
    visibilitySetting: "navigationFlutterLabVisible",
  },
  {
    label: "Notes",
    href: routes.blog,
    icon: Newspaper,
    visibilitySetting: "navigationBlogVisible",
  },
  { label: "Resume", href: routes.resume, icon: FileText, visibilitySetting: "resumeEnabled" },
  {
    label: "GitHub",
    href: routes.github,
    icon: Github,
    visibilitySetting: "navigationGithubVisible",
  },
  {
    label: "Skills",
    href: routes.skills,
    icon: Sparkles,
    visibilitySetting: "navigationSkillsVisible",
  },
  {
    label: "Experience",
    href: routes.experience,
    icon: BriefcaseBusiness,
    visibilitySetting: "navigationExperienceVisible",
  },
  {
    label: "Contact",
    href: routes.contact,
    icon: Mail,
    visibilitySetting: "navigationContactVisible",
  },
];

export const adminNavigation: NavigationItem[] = [
  { label: "Dashboard", href: routes.admin, icon: BarChart3 },
  { label: "Projects", href: routes.adminProjects, icon: Code2 },
  { label: "Categories", href: routes.adminProjectCategories, icon: Tags },
  { label: "Technologies", href: routes.adminTechnologies, icon: Wrench },
  { label: "Blog", href: routes.adminBlog, icon: Newspaper },
  { label: "Skills", href: routes.adminSkills, icon: Wrench },
  { label: "Experience", href: routes.adminExperience, icon: BriefcaseBusiness },
  { label: "Resume", href: routes.adminResume, icon: FileText },
  { label: "Media", href: routes.adminMedia, icon: Upload },
  { label: "Messages", href: routes.adminMessages, icon: Mail },
  { label: "Settings", href: routes.adminSettings, icon: Settings },
  { label: "Profile", href: routes.adminProfile, icon: UserRound },
];

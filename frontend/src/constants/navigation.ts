import {
  BarChart3,
  BriefcaseBusiness,
  Code2,
  FileText,
  Github,
  Home,
  Mail,
  Newspaper,
  Settings,
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
}

export const workspaceNavigation: NavigationItem[] = [
  { label: "Workspace", href: routes.home, icon: Home },
  { label: "Profile", href: routes.profile, icon: UserRound },
  { label: "Projects", href: routes.projects, icon: Code2 },
  { label: "Notes", href: routes.blog, icon: Newspaper },
  { label: "Resume", href: routes.resume, icon: FileText },
  { label: "GitHub", href: routes.github, icon: Github },
  { label: "Skills", href: routes.skills, icon: Sparkles },
  { label: "Experience", href: routes.experience, icon: BriefcaseBusiness },
  { label: "Contact", href: routes.contact, icon: Mail },
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

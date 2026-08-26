import {
  BarChart3,
  Boxes,
  Braces,
  BrainCircuit,
  Cloud,
  Code2,
  Database,
  FileCode,
  GitBranch,
  Globe,
  Palette,
  Server,
  Smartphone,
  TestTube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  SiCss,
  SiDocker,
  SiFastapi,
  SiFigma,
  SiFlutter,
  SiGit,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiNextdotjs,
  SiNodedotjs,
  SiNumpy,
  SiPandas,
  SiPostgresql,
  SiPython,
  SiReact,
  SiScikitlearn,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";
import type { IconType } from "react-icons";

import { cn } from "@/utils/cn";

const brandIcons: Record<string, IconType> = {
  react: SiReact,
  flutter: SiFlutter,
  dart: SiFlutter,
  python: SiPython,
  postgresql: SiPostgresql,
  typescript: SiTypescript,
  javascript: SiJavascript,
  html: SiHtml5,
  css: SiCss,
  tailwind: SiTailwindcss,
  figma: SiFigma,
  nodejs: SiNodedotjs,
  fastapi: SiFastapi,
  docker: SiDocker,
  git: SiGit,
  github: SiGithub,
  nextjs: SiNextdotjs,
  pandas: SiPandas,
  numpy: SiNumpy,
  "scikit-learn": SiScikitlearn,
};

const conceptIcons: Record<string, LucideIcon> = {
  dart: Smartphone,
  mobile: Smartphone,
  braces: Braces,
  database: Database,
  sql: Database,
  code: FileCode,
  frontend: Palette,
  backend: Server,
  server: Server,
  api: Boxes,
  cloud: Cloud,
  devops: Cloud,
  versioning: GitBranch,
  web: Globe,
  testing: TestTube,
  ai: BrainCircuit,
  "data-science": BarChart3,
  analytics: BarChart3,
};

export const skillIconIdentifiers = [
  ...Object.keys(brandIcons),
  ...Object.keys(conceptIcons),
].sort();

interface SkillIconProps {
  identifier?: string | null;
  className?: string;
}

export function SkillIcon({ identifier, className }: SkillIconProps) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const Icon = brandIcons[normalizedIdentifier] ?? conceptIcons[normalizedIdentifier] ?? Code2;
  return <Icon className={cn("h-5 w-5", className)} aria-hidden="true" />;
}

function normalizeIdentifier(identifier?: string | null) {
  return (identifier ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

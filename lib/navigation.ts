import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  Target,
  BarChart3,
  UserRound,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Matches",
    href: "/matches",
    icon: Target,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

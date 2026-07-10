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

/**
 * Nav öğeleri artık görüntü etiketi taşımaz — `key`, i18n kataloğundaki
 * `nav.<key>` girdisine işaret eder. Aktiflik/routing href üzerinden yürür.
 */
export interface NavItem {
  key: "dashboard" | "jobs" | "projects" | "matches" | "analytics" | "profile" | "settings";
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "jobs",      href: "/jobs",      icon: Briefcase },
  { key: "projects",  href: "/projects",  icon: FolderKanban },
  { key: "matches",   href: "/matches",   icon: Target },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
  { key: "profile",   href: "/profile",   icon: UserRound },
  { key: "settings",  href: "/settings",  icon: Settings },
];

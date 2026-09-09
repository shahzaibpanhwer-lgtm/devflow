import type { Route } from "next";
import {
  BookTextIcon,
  ChartNoAxesColumnIcon,
  FolderGitIcon,
  LayoutDashboardIcon,
  RocketIcon,
  SettingsIcon,
  TerminalIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: Route;
  icon: LucideIcon;
  /** Short hint surfaced in the command menu. */
  description: string;
};

/** Primary workspace navigation, in sidebar order. */
export const PRIMARY_NAV: readonly NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    description: "Workspace activity at a glance",
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderGitIcon,
    description: "Create and manage projects",
  },
  {
    label: "Deployments",
    href: "/dashboard/deployments",
    icon: RocketIcon,
    description: "Ship and track releases",
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: ChartNoAxesColumnIcon,
    description: "Traffic, latency and error rates",
  },
  {
    label: "API",
    href: "/dashboard/api",
    icon: TerminalIcon,
    description: "Test endpoints in the playground",
  },
  {
    label: "Documentation",
    href: "/dashboard/docs",
    icon: BookTextIcon,
    description: "API reference and guides",
  },
  {
    label: "Team",
    href: "/dashboard/team",
    icon: UsersIcon,
    description: "Members, roles and invitations",
  },
] as const;

/** Separated in the sidebar by a divider. */
export const SECONDARY_NAV: readonly NavItem[] = [
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon,
    description: "Account and workspace preferences",
  },
] as const;

export const ALL_NAV: readonly NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV];

/**
 * Determines the active navigation entry. `/dashboard` matches exactly so it
 * does not stay highlighted on every nested route.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

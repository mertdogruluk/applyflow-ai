"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const t = useTranslations();

  const fullName = user?.fullName ?? user?.username ?? t("common.account");
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials =
    ((user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")).toUpperCase() ||
    fullName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-full w-60 flex-col bg-sidebar border-r border-sidebar-border",
          "transition-transform duration-300 ease-in-out",
          // Desktop: always visible
          "md:translate-x-0 md:static md:z-auto",
          // Mobile: slide in/out
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 shadow-glow ring-1 ring-inset ring-white/15">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            ApplyFlow AI
          </span>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-0.5 px-3">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              {t("nav.main")}
            </p>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                    )}
                  />
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* User card */}
        <div className="flex items-center gap-3 px-5 py-4">
          <Avatar className="h-8 w-8">
            {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={fullName} />}
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {fullName}
            </p>
            {email && (
              <p className="truncate text-[10px] text-sidebar-foreground/50">
                {email}
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navItems } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuth, UserButton } from "@clerk/nextjs";

interface TopbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ sidebarOpen, onToggleSidebar }: TopbarProps) {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const t = useTranslations();

  const currentKey =
    navItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href))
    )?.key ?? "dashboard";
  const currentPage = t(`nav.${currentKey}`);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-border/70 bg-background/65 px-4 backdrop-blur-xl">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? t("common.closeSidebar") : t("common.openSidebar")}
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-foreground md:text-base">
          {currentPage}
        </h1>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />

        <NotificationBell />

        {isSignedIn && (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        )}
      </div>
    </header>
  );
}

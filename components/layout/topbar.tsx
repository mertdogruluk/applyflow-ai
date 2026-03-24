"use client";

import { Bell, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface TopbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ sidebarOpen, onToggleSidebar }: TopbarProps) {
  const pathname = usePathname();

  const currentPage =
    navItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href))
    )?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-border bg-background/80 backdrop-blur-sm px-4 gap-4">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
            MA
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

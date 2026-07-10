"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Compass,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NotificationType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchNotifications,
  markAllRead,
  markRead,
} from "@/app/(dashboard)/notifications/actions";
import type { NotificationItem } from "@/lib/queries/notifications";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Tür → ikon eşlemesi; etiketler bildirim satırının kendisinde. */
const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  ANALYSIS_READY: Sparkles,
  JOB_ENRICHED:   RefreshCw,
  STATUS_CHANGED: Check,
  JOB_DISCOVERED: Compass,
  MATCH_READY:    Sparkles,
};

/**
 * Topbar'daki işlevsel bildirim zili. Rozet gerçek okunmamış sayısına bağlı;
 * panel açılınca liste tazelenir, satıra tıklamak okundu işaretleyip ilana
 * gider (optimistic — sunucu yanıtı beklenmez).
 */
export function NotificationBell() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const result = await fetchNotifications();
      if (result.ok) {
        setItems(result.items);
        setUnreadCount(result.unreadCount);
      }
      setLoaded(true);
    });
  }

  // İlk yüklemede rozeti doldur; panel her açıldığında tazele.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) refresh();
  }

  function handleItemClick(item: NotificationItem) {
    if (!item.read) {
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      void markRead(item.id);
    }
    setOpen(false);
  }

  function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    void markAllRead();
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label={t("aria")}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold tracking-tight">{t("title")}</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={handleMarkAllRead}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        {!loaded || (isPending && items.length === 0) ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {tc("loading")}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <BellOff className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const Icon = TYPE_ICON[item.type];
                const inner = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors duration-200",
                      item.jobId && "hover:bg-muted/40",
                      !item.read && "bg-primary/4",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                        item.read
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          item.read
                            ? "text-muted-foreground"
                            : "font-medium text-foreground",
                        )}
                      >
                        {item.title}
                      </p>
                      {item.body && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.body}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        {relativeTime(item.createdAt, locale)}
                      </p>
                    </div>
                    {!item.read && (
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );

                return (
                  <li key={item.id}>
                    {item.jobId ? (
                      <Link
                        href={`/jobs/${item.jobId}`}
                        onClick={() => handleItemClick(item)}
                        className="block outline-none focus-visible:bg-muted/40"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className="block w-full text-left outline-none focus-visible:bg-muted/40"
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

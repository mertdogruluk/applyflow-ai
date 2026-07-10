"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  linkProjectToJob,
  unlinkProjectFromJob,
} from "@/app/(dashboard)/jobs/[id]/actions";

interface ProjectLite {
  id: string;
  name: string;
  techStack: string[];
}

interface LinkedProjectsProps {
  jobId: string;
  /** Tüm kullanıcı projeleri */
  allProjects: ProjectLite[];
  /** Bağlı proje id'leri */
  linkedProjectIds: string[];
  /** Bağlı projelerin tam verisi */
  linked: ProjectLite[];
}

export function LinkedProjects({
  jobId,
  allProjects,
  linkedProjectIds,
  linked,
}: LinkedProjectsProps) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const [picking, setPicking] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = allProjects.filter((p) => !linkedProjectIds.includes(p.id));

  const handleLink = async (projectId: string) => {
    setPendingId(projectId);
    setError(null);
    try {
      await linkProjectToJob(jobId, projectId);
      setPicking(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedLink"));
    } finally {
      setPendingId(null);
    }
  };

  const handleUnlink = async (projectId: string) => {
    setPendingId(projectId);
    setError(null);
    try {
      await unlinkProjectFromJob(jobId, projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedUnlink"));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
          {t("linkedTitle")}
        </CardTitle>
        {!picking && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPicking(true)}
            disabled={available.length === 0}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("link")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {/* Picker */}
        {picking && (
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {t("pickTitle")}
              </p>
              <Button variant="ghost" size="xs" onClick={() => setPicking(false)}>
                {tc("cancel")}
              </Button>
            </div>
            {available.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("noMore")}{" "}
                <Link href="/projects/new" className="text-primary hover:underline">
                  {t("createNew")}
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-1">
                {available.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleLink(p.id)}
                      disabled={pendingId !== null}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-background disabled:opacity-50"
                    >
                      <span className="truncate">{p.name}</span>
                      {pendingId === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Linked list */}
        {linked.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noneLinked")}
          </p>
        ) : (
          <ul className="space-y-2">
            {linked.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {p.name}
                  </Link>
                  {p.techStack.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.techStack.slice(0, 6).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleUnlink(p.id)}
                  disabled={pendingId !== null}
                  aria-label={t("unlinkAria", { name: p.name })}
                >
                  {pendingId === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

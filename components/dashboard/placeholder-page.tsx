import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Coming soon card */}
      <Card className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
        <CardContent className="flex flex-col items-center gap-4 pt-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Icon className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-center gap-2">
              <p className="text-base font-semibold">{title}</p>
              <Badge variant="secondary" className="text-[10px]">
                Coming soon
              </Badge>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              This section is under construction. Check back soon for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

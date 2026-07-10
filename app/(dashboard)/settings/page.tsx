import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Mail, User, KeyRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata = { title: "Settings – ApplyFlow AI" };

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";
  const name = user?.fullName ?? user?.username ?? "—";
  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") || "U";
  const t = await getTranslations("settings");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            {t("profileCard")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={name} />}
            <AvatarFallback>{initials.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{name}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {email}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("managedByClerk")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            {t("aiIntegration")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">{t("geminiApi")}</p>
            <Badge variant={process.env.GEMINI_API_KEY ? "default" : "secondary"}>
              {process.env.GEMINI_API_KEY ? t("connected") : t("notConfigured")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t("aiDesc")}</p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("about")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t("aboutText")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

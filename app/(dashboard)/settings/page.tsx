import { PlaceholderPage } from "@/components/dashboard/placeholder-page";
import { Settings } from "lucide-react";

export const metadata = { title: "Settings – ApplyFlow AI" };

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Manage your account preferences, notification settings, connected integrations, and subscription plan."
      icon={Settings}
    />
  );
}

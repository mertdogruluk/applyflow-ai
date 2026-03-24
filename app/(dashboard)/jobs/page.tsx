import { PlaceholderPage } from "@/components/dashboard/placeholder-page";
import { Briefcase } from "lucide-react";

export const metadata = { title: "Jobs – ApplyFlow AI" };

export default function JobsPage() {
  return (
    <PlaceholderPage
      title="Jobs"
      description="Track and manage your job listings. Browse opportunities, save positions, and monitor application progress all in one place."
      icon={Briefcase}
    />
  );
}

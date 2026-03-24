import { PlaceholderPage } from "@/components/dashboard/placeholder-page";
import { FolderKanban } from "lucide-react";

export const metadata = { title: "Projects – ApplyFlow AI" };

export default function ProjectsPage() {
  return (
    <PlaceholderPage
      title="Projects"
      description="Organize your portfolio projects and link them to job applications. Showcase your work and track which projects got you interviews."
      icon={FolderKanban}
    />
  );
}

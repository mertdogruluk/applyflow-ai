import { PlaceholderPage } from "@/components/dashboard/placeholder-page";
import { BarChart3 } from "lucide-react";

export const metadata = { title: "Analytics – ApplyFlow AI" };

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics"
      description="Gain insights into your job search performance. Visualize application trends, response rates, and interview conversion over time."
      icon={BarChart3}
    />
  );
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminAnalyticsClient } from "@/components/admin/admin-analytics-client";

export const metadata = {
  title: "Admin Analytics | RockReach",
  description: "Monitor AI and API usage across your organization",
};

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminAnalyticsClient />;
}

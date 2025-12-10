import { DashboardHeader } from "@/components/dashboard-header";
import { ActivityForm } from "@/components/activity-form";

export default function ActivityPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="System Activity Logs" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <ActivityForm />
      </main>
    </div>
  );
}

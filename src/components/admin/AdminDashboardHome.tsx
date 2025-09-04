import { EnhancedAdminDashboard } from "./EnhancedAdminDashboard";
import { WeekStatusCard } from "./WeekStatusCard";
import { UserActivityCard } from "./UserActivityCard";
import { useCurrentWeek } from "@/hooks/useCurrentWeek";

export const AdminDashboardHome = () => {
  const { currentWeek, refetch } = useCurrentWeek();

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <WeekStatusCard currentWeek={currentWeek} onRefresh={refetch} />
        <UserActivityCard currentWeekId={currentWeek?.id || null} />
      </div>
      
      <EnhancedAdminDashboard />
    </div>
  );
};
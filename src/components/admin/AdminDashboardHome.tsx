import { Calendar, Shield, Users, BarChart3 } from "lucide-react";

export const AdminDashboardHome = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Week Management</span>
          </div>
          <p className="text-sm text-muted-foreground">Manage seasons and weeks</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Leg Approval</span>
          </div>
          <p className="text-sm text-muted-foreground">Review submitted legs</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Group Status</span>
          </div>
          <p className="text-sm text-muted-foreground">Monitor group progress</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Analytics</span>
          </div>
          <p className="text-sm text-muted-foreground">View performance data</p>
        </div>
      </div>
    </div>
  );
};
import { LoginPage } from "@/components/auth/LoginPage";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { GroupCoordination } from "@/components/group/GroupCoordination";
import { WeekManagement } from "@/components/admin/WeekManagement";
import { LegApproval } from "@/components/admin/LegApproval";
import { useAuthContext } from "@/components/AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import AppLayout from "@/components/layout/AppLayout";
import { Routes, Route } from "react-router-dom";
import { Calendar, Shield, Users, BarChart3 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuthContext();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={isAdmin ? <GroupCoordination /> : <Dashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />}>
          <Route index element={<div className="p-6"><h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"><div className="p-4 bg-card rounded-lg border"><div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Week Management</span></div><p className="text-sm text-muted-foreground">Manage seasons and weeks</p></div><div className="p-4 bg-card rounded-lg border"><div className="flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Leg Approval</span></div><p className="text-sm text-muted-foreground">Review submitted legs</p></div><div className="p-4 bg-card rounded-lg border"><div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Group Status</span></div><p className="text-sm text-muted-foreground">Monitor group progress</p></div><div className="p-4 bg-card rounded-lg border"><div className="flex items-center gap-2 mb-2"><BarChart3 className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Analytics</span></div><p className="text-sm text-muted-foreground">View performance data</p></div></div></div>} />
          <Route path="weeks" element={<WeekManagement />} />
          <Route path="legs" element={<LegApproval />} />
          <Route path="users" element={<GroupCoordination />} />
          <Route path="analytics" element={<div className="p-6">Analytics coming soon...</div>} />
          <Route path="settings" element={<div className="p-6">Settings coming soon...</div>} />
        </Route>
        <Route path="/group" element={<GroupCoordination />} />
      </Routes>
    </AppLayout>
  );
};

export default Index;

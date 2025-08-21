import { LoginPage } from "@/components/auth/LoginPage";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { GroupCoordination } from "@/components/group/GroupCoordination";
import { useAuthContext } from "@/components/AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import AppLayout from "@/components/layout/AppLayout";
import { Routes, Route } from "react-router-dom";

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
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/group" element={<GroupCoordination />} />
      </Routes>
    </AppLayout>
  );
};

export default Index;

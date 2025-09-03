import { Outlet, Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import AppLayout from "@/components/layout/AppLayout";

export const AdminDashboard = () => {
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};
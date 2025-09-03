import { LoginPage } from "@/components/auth/LoginPage";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { GroupCoordination } from "@/components/group/GroupCoordination";
import { useAuthContext } from "@/components/AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";

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

  return isAdmin ? <GroupCoordination /> : <Dashboard />;
};

export default Index;

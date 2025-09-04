import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { WeekManagement } from "@/components/admin/WeekManagement";
import { LegApproval } from "@/components/admin/LegApproval";
import { UserManagement } from "@/components/admin/UserManagement";
import { GroupCoordination } from "@/components/group/GroupCoordination";
import { AdminDashboardHome } from "@/components/admin/AdminDashboardHome";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<AdminDashboardHome />} />
                <Route path="weeks" element={<WeekManagement />} />
                <Route path="legs" element={<LegApproval />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="analytics" element={<div className="p-6">Analytics coming soon...</div>} />
                <Route path="settings" element={<div className="p-6">Settings coming soon...</div>} />
              </Route>
              <Route path="/group" element={<GroupCoordination />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

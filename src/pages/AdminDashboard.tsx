import { Routes, Route } from "react-router-dom";
import { WeekManagement } from "@/components/admin/WeekManagement";
import { LegApproval } from "@/components/admin/LegApproval";
import { GroupCoordination } from "@/components/group/GroupCoordination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Shield, Users, BarChart3 } from "lucide-react";

const AdminHome = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Week Management</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Manage seasons and weeks</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leg Approval</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Review submitted legs</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Group Status</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Monitor group progress</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Analytics</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">View performance data</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminHome />} />
      <Route path="weeks" element={<WeekManagement />} />
      <Route path="legs" element={<LegApproval />} />
      <Route path="users" element={<GroupCoordination />} />
      <Route path="analytics" element={<div className="p-6">Analytics coming soon...</div>} />
      <Route path="settings" element={<div className="p-6">Settings coming soon...</div>} />
    </Routes>
  );
};
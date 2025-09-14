import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Shield, 
  TrendingUp, 
  Clock, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  pendingLegs: number;
  approvedLegs: number;
  rejectedLegs: number;
  currentWeekSubmissions: number;
  totalStake: number;
  averageOdds: number;
  weekStatus: string;
}

export const EnhancedAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingLegs: 0,
    approvedLegs: 0,
    rejectedLegs: 0,
    currentWeekSubmissions: 0,
    totalStake: 0,
    averageOdds: 0,
    weekStatus: 'UNKNOWN'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch current week
      const { data: currentWeek } = await supabase
        .from('weeks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Fetch leg statistics
      const { data: legs } = await supabase
        .from('legs')
        .select('status, american_odds, week_id')
        .eq('week_id', currentWeek?.id || '');

      const pendingLegs = legs?.filter(leg => leg.status === 'PENDING').length || 0;
      const approvedLegs = legs?.filter(leg => leg.status === 'OK').length || 0;
      const rejectedLegs = legs?.filter(leg => leg.status === 'REJECTED').length || 0;
      
      const avgOdds = legs && legs.length > 0 
        ? legs.reduce((sum, leg) => sum + Math.abs(leg.american_odds), 0) / legs.length 
        : 0;

      setStats({
        totalUsers: userCount || 0,
        pendingLegs,
        approvedLegs,
        rejectedLegs,
        currentWeekSubmissions: legs?.length || 0,
        totalStake: currentWeek?.stake_amount || 0,
        averageOdds: Math.round(avgOdds),
        weekStatus: currentWeek?.status || 'UNKNOWN'
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Active participants",
      variant: "default" as const
    },
    {
      title: "Pending Approval",
      value: stats.pendingLegs,
      icon: Clock,
      description: "Legs awaiting review",
      variant: "secondary" as const
    },
    {
      title: "Approved Legs",
      value: stats.approvedLegs,
      icon: CheckCircle,
      description: "Currently approved",
      variant: "default" as const
    },
    {
      title: "Rejected Legs",
      value: stats.rejectedLegs,
      icon: XCircle,
      description: "Rejected this week",
      variant: "destructive" as const
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardStats}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your parlay coordination</p>
        </div>
        <Badge variant={stats.weekStatus === 'OPEN' ? 'default' : 'secondary'}>
          Week Status: {stats.weekStatus}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Current Stake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.totalStake / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per participant this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Odds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-{stats.averageOdds}</div>
            <p className="text-xs text-muted-foreground">Across all submitted legs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0 ? Math.round((stats.currentWeekSubmissions / stats.totalUsers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Users have submitted legs</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Approval Status
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• {stats.pendingLegs} legs pending approval</div>
                    <div>• {stats.approvedLegs} legs approved</div>
                    <div>• {stats.rejectedLegs} legs rejected</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participation
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• {stats.totalUsers} total users</div>
                    <div>• {stats.currentWeekSubmissions} submissions this week</div>
                    <div>• Average odds: -{stats.averageOdds}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="alerts" className="space-y-4">
              <div className="space-y-3">
                {stats.pendingLegs > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        {stats.pendingLegs} legs awaiting approval
                      </p>
                      <p className="text-xs text-yellow-600">
                        Review pending submissions to keep the group on track
                      </p>
                    </div>
                  </div>
                )}
                
                {stats.currentWeekSubmissions < stats.totalUsers && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        {stats.totalUsers - stats.currentWeekSubmissions} users haven't submitted
                      </p>
                      <p className="text-xs text-blue-600">
                        Consider sending reminders before the deadline
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/legs'}>
                  Review Legs
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/users'}>
                  Manage Users
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/weeks'}>
                  Week Settings
                </Button>
                <Button variant="outline" size="sm" onClick={fetchDashboardStats}>
                  Refresh Data
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
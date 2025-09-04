import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingState, ErrorState } from "@/components/ui/loading-state";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, UserX, RefreshCw } from "lucide-react";

interface UserActivity {
  user_id: string;
  name: string;
  hasSubmitted: boolean;
  legStatus?: string;
  submittedAt?: string;
}

interface UserActivityCardProps {
  currentWeekId: string | null;
}

export function UserActivityCard({ currentWeekId }: UserActivityCardProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserActivity = async () => {
    if (!currentWeekId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, name');

      if (usersError) throw usersError;

      // Fetch legs for current week
      const { data: legs, error: legsError } = await supabase
        .from('legs')
        .select('user_id, status, created_at')
        .eq('week_id', currentWeekId);

      if (legsError) throw legsError;

      // Combine data
      const userActivities = users?.map(user => {
        const userLeg = legs?.find(leg => leg.user_id === user.user_id);
        return {
          user_id: user.user_id,
          name: user.name,
          hasSubmitted: !!userLeg,
          legStatus: userLeg?.status,
          submittedAt: userLeg?.created_at
        };
      }) || [];

      // Sort by submission status and then by name
      userActivities.sort((a, b) => {
        if (a.hasSubmitted !== b.hasSubmitted) {
          return a.hasSubmitted ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      setActivities(userActivities);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserActivity();
  }, [currentWeekId]);

  const submittedCount = activities.filter(a => a.hasSubmitted).length;
  const totalUsers = activities.length;

  const getActivityIcon = (activity: UserActivity) => {
    if (!activity.hasSubmitted) {
      return <UserX className="h-4 w-4 text-muted-foreground" />;
    }
    
    switch (activity.legStatus) {
      case 'OK':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <UserX className="h-4 w-4 text-red-600" />;
      default:
        return <UserCheck className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (activity: UserActivity) => {
    if (!activity.hasSubmitted) {
      return <Badge variant="outline" className="text-xs">Not Submitted</Badge>;
    }
    
    switch (activity.legStatus) {
      case 'OK':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{activity.legStatus}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState message="Loading user activity..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message={error} onRetry={fetchUserActivity} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Activity
          </span>
          <Button variant="ghost" size="sm" onClick={fetchUserActivity}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          {submittedCount} of {totalUsers} users have submitted legs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <div className="flex-1 bg-background rounded h-2">
            <div 
              className="bg-primary h-full rounded transition-all"
              style={{ width: `${totalUsers > 0 ? (submittedCount / totalUsers) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {totalUsers > 0 ? Math.round((submittedCount / totalUsers) * 100) : 0}%
          </span>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.user_id} className="flex items-center gap-3 p-2 rounded-lg border">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {activity.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.name}</p>
                {activity.submittedAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.submittedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {getActivityIcon(activity)}
                {getStatusBadge(activity)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
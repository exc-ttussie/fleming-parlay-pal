import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Lock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Week {
  id: string;
  week_number: number;
  status: string;
  opens_at: string;
  locks_at: string;
  stake_amount: number;
}

interface WeekStatusCardProps {
  currentWeek: Week | null;
  onRefresh: () => void;
}

export function WeekStatusCard({ currentWeek, onRefresh }: WeekStatusCardProps) {
  if (!currentWeek) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active week found</p>
            <Button variant="outline" onClick={onRefresh} className="mt-2">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="h-4 w-4 text-green-600" />;
      case 'LOCKED':
        return <Lock className="h-4 w-4 text-orange-600" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'LOCKED':
        return 'bg-orange-100 text-orange-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            NFL Week {currentWeek.week_number}
          </span>
          <Badge className={getStatusColor(currentWeek.status)}>
            {getStatusIcon(currentWeek.status)}
            <span className="ml-1">{currentWeek.status}</span>
          </Badge>
        </CardTitle>
        <CardDescription>
          Current week information and deadlines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Opens:</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {formatDateTime(currentWeek.opens_at)}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Locks:</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {formatDateTime(currentWeek.locks_at)}
            </p>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Stake Amount:</span>
            <Badge variant="outline">
              ${(currentWeek.stake_amount / 100).toFixed(2)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
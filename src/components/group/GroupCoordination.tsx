import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Leg, Week } from '@/types/database';
import { toast } from 'sonner';
import { Users, Clock, Target, TrendingUp } from 'lucide-react';
import { formatCurrency, parlayDecimal, parlayPayout } from '@/lib/parlay';

interface LegWithProfile extends Leg {
  profiles?: { name: string; team_name?: string } | null;
}

export const GroupCoordination = () => {
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [legs, setLegs] = useState<LegWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentWeek = async () => {
    try {
      const { data, error } = await supabase
        .from('weeks')
        .select('*')
        .eq('status', 'OPEN')
        .order('week_number', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setCurrentWeek(data);
      return data;
    } catch (error) {
      console.error('Error fetching current week:', error);
      return null;
    }
  };

  const fetchLegs = async (weekId: string) => {
    try {
      const { data, error } = await supabase
        .from('legs')
        .select(`
          *,
          profiles:user_id (name, team_name)
        `)
        .eq('week_id', weekId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLegs((data as unknown) as LegWithProfile[] || []);
    } catch (error) {
      console.error('Error fetching legs:', error);
      toast.error('Failed to fetch legs');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const week = await fetchCurrentWeek();
      if (week) {
        await fetchLegs(week.id);
      }
      setLoading(false);
    };

    initialize();
  }, []);

  const okLegs = legs.filter(leg => leg.status === 'OK');
  const submittedUsers = new Set(legs.map(leg => leg.user_id)).size;
  const targetUsers = 13;
  const completionPercentage = (submittedUsers / targetUsers) * 100;

  const calculateParlay = () => {
    if (okLegs.length === 0) return null;
    
    const decimalOdds = okLegs.map(leg => leg.decimal_odds);
    const combinedDecimal = parlayDecimal(decimalOdds);
    const stakeAmount = currentWeek?.stake_amount || 13000;
    const projectedPayout = parlayPayout(stakeAmount, combinedDecimal);
    
    return {
      combinedDecimal,
      stakeAmount,
      projectedPayout,
      legCount: okLegs.length
    };
  };

  const parlayCalculation = calculateParlay();
  
  const getTimeUntilLock = () => {
    if (!currentWeek) return 'No active week';
    
    const now = new Date();
    const lockTime = new Date(currentWeek.locks_at);
    const timeDiff = lockTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Locked';
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!currentWeek) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No Active Week</p>
              <p className="text-muted-foreground">Contact an admin to open a new week</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Group Coordination - Week {currentWeek.week_number}</h1>
        <Badge variant={currentWeek.status === 'OPEN' ? 'default' : 'secondary'}>
          {currentWeek.status}
        </Badge>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Until Lock</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTimeUntilLock()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group Progress</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedUsers}/{targetUsers}</div>
            <Progress value={completionPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Legs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{okLegs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {legs.length - okLegs.length} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parlayCalculation ? formatCurrency(parlayCalculation.projectedPayout) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {parlayCalculation ? `${parlayCalculation.legCount} legs` : 'No legs'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Group Members Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Submission Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {legs.map((leg) => (
              <div key={leg.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">
                      {leg.profiles?.name || 'Unknown User'}
                      {leg.profiles?.team_name && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({leg.profiles.team_name})
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{leg.game_desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    leg.status === 'OK' ? 'default' :
                    leg.status === 'PENDING' ? 'secondary' :
                    leg.status === 'CONFLICT' ? 'destructive' : 'outline'
                  }>
                    {leg.status}
                  </Badge>
                  {leg.status === 'OK' && (
                    <span className="text-sm font-mono">
                      {leg.american_odds > 0 ? '+' : ''}{leg.american_odds}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Parlay Summary */}
      {parlayCalculation && (
        <Card>
          <CardHeader>
            <CardTitle>Current Group Parlay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Stake</p>
                <p className="text-2xl font-bold">{formatCurrency(parlayCalculation.stakeAmount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Combined Odds</p>
                <p className="text-2xl font-bold">+{Math.round((parlayCalculation.combinedDecimal - 1) * 100)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projected Payout</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(parlayCalculation.projectedPayout)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
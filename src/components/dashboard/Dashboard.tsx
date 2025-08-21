import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";
import { formatCurrency, americanToDecimal, parlayDecimal, parlayPayout } from "@/lib/parlay";
import { Clock, Users, DollarSign, TrendingUp, LogOut } from "lucide-react";
import { LegsTable } from "./LegsTable";
import { EnhancedCreateLegModal } from "./EnhancedCreateLegModal";

import type { Leg, Week } from '@/types/database';

interface WeekWithSeason extends Week {
  seasons?: {
    label: string;
  };
}

interface LegWithProfile extends Leg {
  profiles?: {
    name: string;
  };
}

export const Dashboard = () => {
  const { user } = useAuthContext();
  const [currentWeek, setCurrentWeek] = useState<WeekWithSeason | null>(null);
  const [legs, setLegs] = useState<LegWithProfile[]>([]);
  const [userLeg, setUserLeg] = useState<LegWithProfile | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCurrentWeek = async () => {
    try {
      const now = new Date();
      const { data: weeks, error } = await supabase
        .from('weeks')
        .select(`
          *,
          seasons:season_id (
            label
          )
        `)
        .eq('status', 'OPEN')
        .lte('opens_at', now.toISOString())
        .gte('locks_at', now.toISOString())
        .order('opens_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (weeks && weeks.length > 0) {
        setCurrentWeek(weeks[0]);
        await fetchLegs(weeks[0].id);
      }
    } catch (error) {
      console.error('Error fetching current week:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLegs = async (weekId: string) => {
    try {
      // First fetch legs
      const { data: legsData, error: legsError } = await supabase
        .from('legs')
        .select('*')
        .eq('week_id', weekId);

      if (legsError) throw legsError;

      // Then fetch profiles for the users
      const userIds = legsData?.map(leg => leg.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('safe_profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const legsWithProfiles = legsData?.map(leg => ({
        ...leg,
        profiles: profilesData?.find(profile => profile.user_id === leg.user_id) || { name: 'Unknown User' }
      })) || [];

      setLegs(legsWithProfiles);
      const myLeg = legsWithProfiles?.find(leg => leg.user_id === user?.id);
      setUserLeg(myLeg || null);
    } catch (error) {
      console.error('Error fetching legs:', error);
    }
  };

  useEffect(() => {
    fetchCurrentWeek();
  }, []);

  const getTimeUntilLock = () => {
    if (!currentWeek) return '';
    
    const lockTime = new Date(currentWeek.locks_at);
    const now = new Date();
    const diff = lockTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'LOCKED';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculateParlay = () => {
    const validLegs = legs.filter(leg => leg.status === 'OK' || leg.status === 'PENDING');
    if (validLegs.length === 0) return null;
    
    const decimalOdds = validLegs.map(leg => leg.decimal_odds);
    const combinedDecimal = parlayDecimal(decimalOdds);
    const projectedPayout = parlayPayout(currentWeek?.stake_amount || 1000, combinedDecimal);
    
    return {
      legsCount: validLegs.length,
      combinedDecimal,
      projectedPayout,
      stake: currentWeek?.stake_amount || 1000
    };
  };

  const parlay = calculateParlay();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fleming Parlay Coordinator</h1>
            <p className="text-muted-foreground">
              {currentWeek?.seasons?.label} - Week {currentWeek?.week_number}
            </p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Lock Time</p>
                  <p className="font-medium">{getTimeUntilLock()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Submissions</p>
                  <p className="font-medium">{legs.length}/13</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Stake</p>
                  <p className="font-medium">{formatCurrency(currentWeek?.stake_amount || 1000)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Potential Payout</p>
                  <p className="font-medium">{parlay ? formatCurrency(parlay.projectedPayout) : '$0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Your Status
              {currentWeek?.status === 'OPEN' && !userLeg && (
                <Button onClick={() => setShowSubmitModal(true)}>
                  Submit Your Leg
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userLeg ? (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Submitted</Badge>
                <span className="text-sm text-muted-foreground">
                  {userLeg.selection} ({userLeg.american_odds > 0 ? '+' : ''}{userLeg.american_odds})
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Not Submitted</Badge>
                <span className="text-sm text-muted-foreground">
                  {currentWeek?.status === 'OPEN' ? 'Submit your leg before the deadline' : 'Submission period closed'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Legs */}
        <Card>
          <CardHeader>
            <CardTitle>Group Legs</CardTitle>
            <CardDescription>
              All submitted legs for this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LegsTable legs={legs} onRefresh={fetchCurrentWeek} />
          </CardContent>
        </Card>

        {/* Parlay Summary */}
        {parlay && (
          <Card>
            <CardHeader>
              <CardTitle>Parlay Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Legs Count</p>
                  <p className="text-2xl font-bold">{parlay.legsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Combined Odds</p>
                  <p className="text-2xl font-bold">+{Math.round((parlay.combinedDecimal - 1) * 100)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stake</p>
                  <p className="text-2xl font-bold">{formatCurrency(parlay.stake)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projected Payout</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(parlay.projectedPayout)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && currentWeek && (
        <EnhancedCreateLegModal
          open={showSubmitModal}
          onOpenChange={setShowSubmitModal}
          onLegCreated={fetchCurrentWeek}
          weekId={currentWeek.id}
        />
      )}
    </div>
  );
};
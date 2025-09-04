import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, parlayDecimal, parlayPayout } from "@/lib/parlay";
import { getNextSundayLockTime } from "@/lib/dateUtils";
import { Clock, Users, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { LegsTable } from "./LegsTable";
import { EnhancedCreateLegModal } from "./EnhancedCreateLegModal";
import { useCurrentWeek } from "@/hooks/useCurrentWeek";
import { useLegs } from "@/hooks/useLegs";

export const Dashboard = () => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { currentWeek, loading: weekLoading, error: weekError, refetch: refetchWeek } = useCurrentWeek();
  const { legs, userLeg, loading: legsLoading, error: legsError, refetch: refetchLegs } = useLegs(currentWeek?.id || null);

  const handleRefresh = () => {
    refetchWeek();
    refetchLegs();
  };

  const getTimeUntilLock = () => {
    const lockTime = getNextSundayLockTime();
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
  const loading = weekLoading || legsLoading;

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
    <div className="p-4">
      <div className="max-w-7xl mx-auto space-y-6">

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
                  <p className="text-sm text-muted-foreground">NFL Week</p>
                  <p className="font-medium">
                    Week {currentWeek?.week_number}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Status Information */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-muted-foreground">
              <p className="text-sm mb-2">
                📊 Real-time NFL odds powered by The Odds API
              </p>
              <p className="text-xs">
                Current season: 2024-25 NFL Season • 
                Updated continuously for next 14 days of games
              </p>
            </div>
          </CardContent>
        </Card>

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
            <CardTitle className="flex items-center justify-between">
              Group Legs
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
            <CardDescription>
              All submitted legs for this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weekError || legsError ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  {weekError || legsError}
                </p>
                <Button variant="outline" onClick={handleRefresh} className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : (
              <LegsTable legs={legs} onRefresh={handleRefresh} />
            )}
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
          onLegCreated={handleRefresh}
          weekId={currentWeek.id}
        />
      )}
    </div>
  );
};
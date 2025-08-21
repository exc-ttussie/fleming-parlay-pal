import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, BarChart3, TrendingUp } from 'lucide-react';
import { EnhancedCreateLegModal } from './EnhancedCreateLegModal';
import { SimpleParlayBuilder } from './SimpleParlayBuilder';
import { LegsTable } from './LegsTable';
import { toast } from '@/hooks/use-toast';

import type { Leg, Parlay } from '@/types/database';

export const ParlayDashboard = () => {
  const { user } = useAuth();
  const [legs, setLegs] = useState<Leg[]>([]);
  const [parlays, setParlays] = useState<(Parlay & { legs: Leg[] })[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('legs');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch legs
      const { data: legsData, error: legsError } = await supabase
        .from('legs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (legsError) throw legsError;
      setLegs(legsData || []);

      // Fetch parlays - note: no user_id filtering as table doesn't have this column
      const { data: parlaysData, error: parlaysError } = await supabase
        .from('parlays')
        .select('*')
        .order('created_at', { ascending: false });

      if (parlaysError) throw parlaysError;
      
      // For now, set empty legs array since we need to understand the relationship
      const transformedParlays = parlaysData?.map((parlay: Parlay) => ({
        ...parlay,
        legs: [] as Leg[]
      })) || [];
      
      setParlays(transformedParlays);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLegCreated = () => {
    fetchData();
    setShowCreateModal(false);
    toast({
      title: "Success",
      description: "Leg created successfully",
    });
  };

  const fetchOdds = async () => {
    try {
      toast({
        title: "Fetching Odds",
        description: "Updating latest odds data...",
      });

      const { data, error } = await supabase.functions.invoke('fetch-odds');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Odds updated! Processed ${data.games_processed} games`,
      });
      
    } catch (error: any) {
      console.error('Error fetching odds:', error);
      toast({
        title: "Error",
        description: "Failed to fetch odds",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const activeParlays = parlays; // All parlays for now
  const completedParlays: (Parlay & { legs: Leg[] })[] = []; // Empty for now
  const pendingLegs = legs.filter(leg => leg.status === 'PENDING'); // Filter pending legs
  const totalStake = parlays.reduce((sum, parlay) => sum + parlay.stake_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fleming Parlay Coordinator</h1>
        <div className="flex gap-3">
          <Button onClick={fetchOdds} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Fetch Latest Odds
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Leg
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Legs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{legs.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingLegs.length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Parlays</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeParlays.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedParlays.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stake</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalStake.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across all legs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              0%
            </div>
            <p className="text-xs text-muted-foreground">
              0 wins / {legs.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="legs">All Legs</TabsTrigger>
          <TabsTrigger value="parlays">Parlays</TabsTrigger>
          <TabsTrigger value="calculator">Parlay Calculator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="legs" className="space-y-4">
          <LegsTable legs={legs} onRefresh={fetchData} />
        </TabsContent>
        
        <TabsContent value="parlays" className="space-y-4">
          <div className="grid gap-4">
            {parlays.map(parlay => (
              <Card key={parlay.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Parlay #{parlay.id.slice(0, 8)}</CardTitle>
                    <Badge variant="default">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stake Amount</p>
                      <p className="font-semibold">${parlay.stake_amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Projected Payout</p>
                      <p className="font-semibold">${parlay.projected_payout}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Legs Count</p>
                      <p className="font-semibold">{parlay.legs_count}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        Combined Odds: {parlay.combined_american > 0 ? '+' : ''}{parlay.combined_american}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Decimal: {parlay.combined_decimal}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {parlays.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No parlays created yet.</p>
                <Button 
                  onClick={() => setActiveTab('calculator')} 
                  className="mt-4"
                >
                  Create Your First Parlay
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="calculator" className="space-y-4">
          <SimpleParlayBuilder legs={legs} onParlayCreated={fetchData} />
        </TabsContent>
      </Tabs>

      <EnhancedCreateLegModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onLegCreated={handleLegCreated}
        weekId="sample-week-id" // TODO: Get current week ID from context
      />
    </div>
  );
};
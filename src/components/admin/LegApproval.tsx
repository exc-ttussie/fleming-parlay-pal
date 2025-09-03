import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Leg } from '@/types/database';
import { toast } from 'sonner';
import { Check, X, AlertCircle } from 'lucide-react';

interface LegWithProfile extends Leg {
  profiles?: { name: string; user_id: string } | null;
}

export const LegApproval = () => {
  const [legs, setLegs] = useState<LegWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  const fetchPendingLegs = async () => {
    try {
      // First get pending legs
      const { data: legsData, error: legsError } = await supabase
        .from('legs')
        .select('*')
        .in('status', ['PENDING', 'CONFLICT'])
        .order('created_at', { ascending: true });

      if (legsError) throw legsError;

      // Then get profiles for each leg
      const userIds = legsData?.map(leg => leg.user_id).filter(Boolean) || [];
      
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Combine legs with profile data
      const legsWithProfiles = legsData?.map(leg => ({
        ...leg,
        profiles: profilesData.find(profile => profile.user_id === leg.user_id) || null
      })) || [];

      setLegs(legsWithProfiles);
    } catch (error) {
      console.error('Error fetching pending legs:', error);
      toast.error('Unable to fetch legs for approval. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateLegStatus = async (legId: string, status: 'OK' | 'DUPLICATE' | 'CONFLICT' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('legs')
        .update({ 
          status,
          notes: notes[legId] || null
        })
        .eq('id', legId);

      if (error) throw error;
      
      toast.success(`Leg ${status.toLowerCase()}`);
      fetchPendingLegs();
      setNotes(prev => ({ ...prev, [legId]: '' }));
    } catch (error) {
      console.error('Error updating leg status:', error);
      toast.error('Failed to update leg status');
    }
  };

  useEffect(() => {
    fetchPendingLegs();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'secondary',
      CONFLICT: 'destructive',
      OK: 'default',
      DUPLICATE: 'outline',
      REJECTED: 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Leg Approval</h1>
        <Badge variant="secondary">{legs.length} pending</Badge>
      </div>

      {legs.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Check className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-muted-foreground">No legs pending approval</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {legs.map((leg) => (
            <Card key={leg.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {leg.game_desc}
                  </CardTitle>
                  {getStatusBadge(leg.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Submitted by {leg.profiles?.name || 'Unknown'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Selection</p>
                    <p>{leg.selection}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Market</p>
                    <p>{leg.market_key}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Odds</p>
                    <p>{leg.american_odds > 0 ? '+' : ''}{leg.american_odds}</p>
                  </div>
                  {leg.line && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Line</p>
                      <p>{leg.line}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bookmaker</p>
                    <p>{leg.bookmaker}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Source</p>
                    <p>{leg.source}</p>
                  </div>
                </div>

                {leg.notes && (
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Existing Notes</p>
                    <p className="text-sm">{leg.notes}</p>
                  </div>
                )}

                <div className="mb-4">
                  <Textarea
                    placeholder="Add notes (optional)..."
                    value={notes[leg.id] || ''}
                    onChange={(e) => setNotes(prev => ({ ...prev, [leg.id]: e.target.value }))}
                    className="mb-2"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateLegStatus(leg.id, 'OK')}
                    variant="default"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => updateLegStatus(leg.id, 'DUPLICATE')}
                    variant="outline"
                    size="sm"
                  >
                    Mark Duplicate
                  </Button>
                  <Button
                    onClick={() => updateLegStatus(leg.id, 'CONFLICT')}
                    variant="outline"
                    size="sm"
                  >
                    Flag Conflict
                  </Button>
                  <Button
                    onClick={() => updateLegStatus(leg.id, 'REJECTED')}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
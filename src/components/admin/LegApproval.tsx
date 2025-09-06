import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Leg } from '@/types/database';
import { toast } from 'sonner';
import { Check, X, AlertCircle, CheckSquare, Square, Filter } from 'lucide-react';
import { formatPropDisplayName } from '@/lib/propUtils';

interface LegWithProfile extends Leg {
  profiles?: { name: string; user_id: string } | null;
}

export const LegApproval = () => {
  const [legs, setLegs] = useState<LegWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [selectedLegs, setSelectedLegs] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchPendingLegs = async () => {
    try {
      // Fetch legs based on status filter
      let query = supabase.from('legs').select('*');
      
      if (statusFilter === 'all') {
        query = query.in('status', ['PENDING', 'CONFLICT']);
      } else if (statusFilter === 'pending') {
        query = query.eq('status', 'PENDING');
      } else if (statusFilter === 'conflict') {
        query = query.eq('status', 'CONFLICT');
      } else if (statusFilter === 'approved') {
        query = query.eq('status', 'OK');
      } else if (statusFilter === 'all_statuses') {
        // No filter, get all statuses
      } else {
        query = query.in('status', ['PENDING', 'CONFLICT']);
      }
        
      const { data: legsData, error: legsError } = await query.order('created_at', { ascending: false });

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

  const updateLegStatus = async (legId: string, status: 'OK' | 'DUPLICATE' | 'CONFLICT' | 'REJECTED' | 'PENDING') => {
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
      setSelectedLegs(prev => {
        const newSet = new Set(prev);
        newSet.delete(legId);
        return newSet;
      });
    } catch (error) {
      console.error('Error updating leg status:', error);
      toast.error('Failed to update leg status');
    }
  };

  const batchUpdateLegs = async (status: 'OK' | 'DUPLICATE' | 'CONFLICT' | 'REJECTED' | 'PENDING') => {
    if (selectedLegs.size === 0) {
      toast.error('No legs selected');
      return;
    }

    try {
      const updates = Array.from(selectedLegs).map(legId => 
        supabase
          .from('legs')
          .update({ 
            status,
            notes: notes[legId] || null 
          })
          .eq('id', legId)
      );

      const results = await Promise.all(updates);
      
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} legs`);
      }

      toast.success(`${selectedLegs.size} legs ${status.toLowerCase()}`);
      setSelectedLegs(new Set());
      fetchPendingLegs();
    } catch (error) {
      console.error('Error batch updating legs:', error);
      toast.error('Failed to update selected legs');
    }
  };

  const toggleLegSelection = (legId: string) => {
    setSelectedLegs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(legId)) {
        newSet.delete(legId);
      } else {
        newSet.add(legId);
      }
      return newSet;
    });
  };

  const selectAllLegs = () => {
    const allLegIds = legs.map(leg => leg.id);
    setSelectedLegs(new Set(allLegIds));
  };

  const clearSelection = () => {
    setSelectedLegs(new Set());
  };

  useEffect(() => {
    fetchPendingLegs();
  }, [statusFilter]);


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
        <div>
          <h1 className="text-3xl font-bold">Leg Approval</h1>
          <p className="text-muted-foreground">Review and manage leg submissions</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pending</SelectItem>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="conflict">Conflicts Only</SelectItem>
              <SelectItem value="approved">Approved Only</SelectItem>
              <SelectItem value="all_statuses">All Statuses</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">{legs.length} legs</Badge>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedLegs.size > 0 && (
        <Card className="mb-6 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">{selectedLegs.size} selected</span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => batchUpdateLegs('OK')}
                  variant="default"
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve All
                </Button>
                <Button
                  onClick={() => batchUpdateLegs('DUPLICATE')}
                  variant="outline"
                  size="sm"
                >
                  Mark Duplicate
                </Button>
                <Button
                  onClick={() => batchUpdateLegs('CONFLICT')}
                  variant="outline"
                  size="sm"
                >
                  Flag Conflict
                </Button>
                <Button
                  onClick={() => batchUpdateLegs('REJECTED')}
                  variant="destructive"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
        <div className="space-y-4">
          {/* Select All Option */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={selectedLegs.size === legs.length && legs.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllLegs();
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                  <label className="text-sm font-medium">
                    Select All ({legs.length} legs)
                  </label>
                </div>
                
                <Button variant="ghost" size="sm" onClick={fetchPendingLegs}>
                  <Filter className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {legs.map((leg) => (
            <Card key={leg.id} className={`relative ${selectedLegs.has(leg.id) ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedLegs.has(leg.id)}
                      onCheckedChange={() => toggleLegSelection(leg.id)}
                    />
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      {leg.game_desc}
                    </CardTitle>
                  </div>
                  {getStatusBadge(leg.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Submitted by {leg.profiles?.name || 'Unknown'}
                </p>
              </CardHeader>
              <CardContent>
                {/* Enhanced bet information display */}
                <div className="bg-muted/30 p-4 rounded-lg mb-4">
                  <div className="text-lg font-semibold mb-2">
                    {leg.player_name ? (
                      `${leg.player_name} - ${formatPropDisplayName(leg.prop_type || '')}`
                    ) : (
                      'Game Bet'
                    )}
                  </div>
                  
                  <div className="text-xl font-bold text-primary mb-1">
                    {leg.selection}
                  </div>
                  
                  {leg.prop_category && (
                    <div className="text-sm text-muted-foreground">
                      Category: {leg.prop_category}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Market</p>
                    <p>{formatPropDisplayName(leg.market_key)}</p>
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
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">League</p>
                    <p>{leg.league}</p>
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
                  {leg.status === 'OK' ? (
                    <Button
                      onClick={() => updateLegStatus(leg.id, 'PENDING')}
                      variant="outline"
                      size="sm"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Revert to Pending
                    </Button>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
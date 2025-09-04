import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Edit3, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuthContext } from '@/components/AuthProvider';
import { useState } from 'react';
import { EditLegModal } from './EditLegModal';
import type { Leg } from '@/types/database';

interface LegWithProfile extends Leg {
  profiles?: {
    name: string;
  };
}

interface LegsTableProps {
  legs: LegWithProfile[];
  onRefresh: () => void;
  allowEdit?: boolean;
}

export const LegsTable = ({ legs, onRefresh, allowEdit = true }: LegsTableProps) => {
  const { user } = useAuthContext();
  const [editingLeg, setEditingLeg] = useState<Leg | null>(null);
  const deleteLeg = async (legId: string) => {
    try {
      const { error } = await supabase
        .from('legs')
        .delete()
        .eq('id', legId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leg deleted successfully",
      });
      
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting leg:', error);
      toast({
        title: "Error",
        description: "Failed to delete leg",
        variant: "destructive",
      });
    }
  };

  const canEditLeg = (leg: Leg) => {
    return allowEdit && user?.id === leg.user_id && leg.status === 'PENDING';
  };

  const canDeleteLeg = (leg: Leg) => {
    return user?.id === leg.user_id && leg.status !== 'OK';
  };

  if (legs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 w-12 h-12 bg-muted/10 rounded-full flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">No legs found</p>
        <p className="text-muted-foreground">Create your first leg to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Player/Market</TableHead>
              <TableHead>Selection</TableHead>
              <TableHead>Odds</TableHead>
              <TableHead>Bookmaker</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {legs.map((leg) => (
              <TableRow key={leg.id}>
                <TableCell>
                  <div className="font-medium">
                    {leg.profiles?.name || 'Unknown User'}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{leg.game_desc}</div>
                    <div className="text-sm text-muted-foreground">
                      {leg.league} • {leg.sport_key}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {leg.player_name ? (
                      <>
                        <div className="font-medium">{leg.player_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {leg.prop_category}
                          </Badge>
                          <span>{leg.market_key?.replace('player_', '').replace(/_/g, ' ')}</span>
                        </div>
                      </>
                    ) : (
                      <Badge variant="outline">{leg.market_key}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{leg.selection}</div>
                  {leg.line && (
                    <div className="text-sm text-muted-foreground">
                      Line: {leg.line}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-mono">
                    {leg.american_odds > 0 ? '+' : ''}{leg.american_odds}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {leg.decimal_odds.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{leg.bookmaker}</Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      leg.status === 'OK' ? 'default' : 
                      leg.status === 'REJECTED' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {leg.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {leg.game_id && (
                      <Button size="sm" variant="ghost" title="View game details">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canEditLeg(leg) && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setEditingLeg(leg)}
                        title="Edit leg"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canDeleteLeg(leg) && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteLeg(leg.id)}
                        title="Delete leg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {editingLeg && (
        <EditLegModal
          open={!!editingLeg}
          onOpenChange={(open) => !open && setEditingLeg(null)}
          leg={editingLeg}
          onLegUpdated={() => {
            onRefresh();
            setEditingLeg(null);
          }}
        />
      )}
    </>
  );
};
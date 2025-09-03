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
import { Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Leg } from '@/types/database';

interface LegWithProfile extends Leg {
  profiles?: {
    name: string;
  };
}

interface LegsTableProps {
  legs: LegWithProfile[];
  onRefresh: () => void;
}

export const LegsTable = ({ legs, onRefresh }: LegsTableProps) => {
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

  if (legs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No legs found. Create your first leg!</p>
      </div>
    );
  }

  return (
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
                <div className="flex items-center justify-end gap-2">
                  {leg.game_id && (
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteLeg(leg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
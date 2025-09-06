import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditLegModal } from "./EditLegModal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { toast } from "sonner";
import { Edit, Trash2, ExternalLink } from "lucide-react";
import type { Leg } from "@/types/database";
import { formatPropDisplayName } from "@/lib/propUtils";

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
  const { user } = useAuthContext();
  const [editingLeg, setEditingLeg] = useState<LegWithProfile | null>(null);
  const [deletingLegId, setDeletingLegId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [legToDelete, setLegToDelete] = useState<string | null>(null);

  const handleDeleteClick = (legId: string) => {
    setLegToDelete(legId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !legToDelete) return;
    
    setDeletingLegId(legToDelete);
    
    try {
      const { error } = await supabase
        .from('legs')
        .delete()
        .eq('id', legToDelete);

      if (error) throw error;
      
      toast.success("Leg deleted successfully");
      onRefresh();
    } catch (error) {
      console.error('Error deleting leg:', error);
      toast.error("Failed to delete leg");
    } finally {
      setDeletingLegId(null);
      setLegToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const canEditLeg = (leg: LegWithProfile) => {
    return user?.id === leg.user_id && leg.status === 'PENDING';
  };

  const canDeleteLeg = (leg: LegWithProfile) => {
    return user?.id === leg.user_id && leg.status === 'PENDING';
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'DUPLICATE':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Duplicate</Badge>;
      case 'CONFLICT':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Conflict</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (legs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <div className="mb-4 text-4xl">🎯</div>
            <p className="text-lg font-medium mb-2">No legs submitted yet</p>
            <p className="text-sm">Be the first to submit a leg for this week!</p>
          </div>
        </CardContent>
      </Card>
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
              <TableHead>Selection</TableHead>
              <TableHead>Odds</TableHead>
              <TableHead>Bookmaker</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {legs.map((leg) => (
              <TableRow key={leg.id} className={leg.user_id === user?.id ? "bg-muted/30" : ""}>
                <TableCell>
                  <div className="font-medium">
                    {leg.profiles?.name || 'Unknown User'}
                    {leg.user_id === user?.id && (
                      <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{leg.game_desc}</div>
                    <div className="text-sm text-muted-foreground">
                      {leg.league}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {leg.player_name ? (
                      // Player prop: Show "Player Name - Prop Type: Selection"
                      <>
                        <div className="font-medium text-foreground">
                          {leg.player_name}
                        </div>
                        <div className="text-sm font-medium text-primary">
                          {leg.prop_type ? formatPropDisplayName(leg.prop_type) : 'Player Prop'}: {leg.selection}
                        </div>
                      </>
                    ) : (
                      // Game bet: Show selection prominently
                      <div className="font-medium text-primary text-base">
                        {leg.selection}
                      </div>
                    )}
                    {leg.prop_category && (
                      <div className="text-xs text-muted-foreground">
                        {leg.prop_category}
                      </div>
                    )}
                    {leg.line && (
                      <div className="text-sm font-medium text-foreground">
                        Line: {leg.line}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono font-medium">
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
                  {getStatusBadge(leg.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canEditLeg(leg) && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingLeg(leg)}
                        className="h-8 w-8 p-0"
                        title="Edit leg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canDeleteLeg(leg) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(leg.id)}
                        disabled={deletingLegId === leg.id}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete leg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {leg.game_id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        title="View game details"
                      >
                        <ExternalLink className="h-4 w-4" />
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
          leg={editingLeg}
          open={!!editingLeg}
          onOpenChange={(open) => !open && setEditingLeg(null)}
          onLegUpdated={onRefresh}
        />
      )}
      
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Leg"
        description="Are you sure you want to delete this leg? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
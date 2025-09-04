import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";

interface BatchLegActionsProps {
  selectedLegs: Set<string>;
  onClearSelection: () => void;
  onRefresh: () => void;
  totalLegs: number;
}

export function BatchLegActions({ 
  selectedLegs, 
  onClearSelection, 
  onRefresh,
  totalLegs 
}: BatchLegActionsProps) {
  const [processing, setProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    status: string;
    count: number;
  } | null>(null);

  const handleBatchAction = (status: 'OK' | 'REJECTED' | 'DUPLICATE' | 'CONFLICT') => {
    setPendingAction({
      status,
      count: selectedLegs.size
    });
    setShowConfirmDialog(true);
  };

  const executeBatchAction = async () => {
    if (!pendingAction) return;
    
    setProcessing(true);
    
    try {
      const { error } = await supabase
        .from('legs')
        .update({ status: pendingAction.status as 'OK' | 'REJECTED' | 'DUPLICATE' | 'CONFLICT' })
        .in('id', Array.from(selectedLegs));

      if (error) throw error;

      toast.success(`Successfully updated ${pendingAction.count} legs to ${pendingAction.status}`);
      onClearSelection();
      onRefresh();
    } catch (error) {
      console.error('Error updating legs:', error);
      toast.error('Failed to update legs. Please try again.');
    } finally {
      setProcessing(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  if (selectedLegs.size === 0) {
    return null;
  }

  const getActionIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'DUPLICATE':
      case 'CONFLICT':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionLabel = (status: string) => {
    switch (status) {
      case 'OK':
        return 'Approve';
      case 'REJECTED':
        return 'Reject';
      case 'DUPLICATE':
        return 'Mark Duplicate';
      case 'CONFLICT':
        return 'Mark Conflict';
      default:
        return status;
    }
  };

  const getConfirmationMessage = () => {
    if (!pendingAction) return '';
    
    const actionText = getActionLabel(pendingAction.status).toLowerCase();
    return `Are you sure you want to ${actionText} ${pendingAction.count} selected leg${pendingAction.count > 1 ? 's' : ''}? This action cannot be undone.`;
  };

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Checkbox checked={true} />
              Batch Actions
            </span>
            <Badge variant="secondary">
              {selectedLegs.size} of {totalLegs} selected
            </Badge>
          </CardTitle>
          <CardDescription>
            Perform actions on multiple legs at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              onClick={() => handleBatchAction('OK')}
              disabled={processing}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve All
            </Button>
            
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleBatchAction('REJECTED')}
              disabled={processing}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject All
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBatchAction('DUPLICATE')}
              disabled={processing}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Mark Duplicate
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBatchAction('CONFLICT')}
              disabled={processing}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Mark Conflict
            </Button>
            
            <div className="ml-auto">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onClearSelection}
                disabled={processing}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={`Batch ${pendingAction ? getActionLabel(pendingAction.status) : 'Action'}`}
        description={getConfirmationMessage()}
        confirmLabel={`${pendingAction ? getActionLabel(pendingAction.status) : 'Continue'} All`}
        cancelLabel="Cancel"
        variant={pendingAction?.status === 'REJECTED' ? 'destructive' : 'default'}
        onConfirm={executeBatchAction}
      />
    </>
  );
}
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { americanToDecimal } from "@/lib/parlay";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SubmitLegModalProps {
  open: boolean;
  onClose: () => void;
  weekId: string;
  onSuccess: () => void;
}

export const SubmitLegModal = ({ open, onClose, weekId, onSuccess }: SubmitLegModalProps) => {
  const { user } = useAuthContext();
  const [source, setSource] = useState<'api' | 'manual'>('manual');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [gameDesc, setGameDesc] = useState('');
  const [marketKey, setMarketKey] = useState('');
  const [selection, setSelection] = useState('');
  const [line, setLine] = useState('');
  const [americanOdds, setAmericanOdds] = useState('');
  const [notes, setNotes] = useState('');

  const validateForm = () => {
    if (!gameDesc.trim() || !marketKey || !selection.trim() || !americanOdds) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    const odds = parseInt(americanOdds);
    if (isNaN(odds) || odds < -10000 || odds > 10000 || odds === 0) {
      toast({
        title: "Invalid Odds",
        description: "American odds must be a number between -10000 and +10000 (excluding 0)",
        variant: "destructive",
      });
      return false;
    }

    // Sanitize notes to prevent XSS
    if (notes.length > 500) {
      toast({
        title: "Invalid Notes",
        description: "Notes must be 500 characters or less",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const odds = parseInt(americanOdds);
      const decimal = americanToDecimal(odds);
      
      const { error } = await supabase
        .from('legs')
        .insert({
          week_id: weekId,
          user_id: user.id,
          sport_key: 'americanfootball_nfl',
          league: 'NFL',
          game_desc: gameDesc.trim(),
          market_key: marketKey,
          selection: selection.trim(),
          line: line ? parseFloat(line) : null,
          american_odds: odds,
          decimal_odds: decimal,
          source: source,
          bookmaker: 'draftkings',
          notes: notes.trim().replace(/<[^>]*>/g, '') || null, // Strip HTML tags for security
          status: 'PENDING'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your leg has been submitted successfully",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting leg:', error);
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit leg",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Your Parlay Leg</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Source Selection */}
          <div>
            <Label>Source</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={source === 'api' ? 'default' : 'outline'}
                onClick={() => setSource('api')}
                disabled
              >
                Find on DraftKings (Coming Soon)
              </Button>
              <Button
                variant={source === 'manual' ? 'default' : 'outline'}
                onClick={() => setSource('manual')}
              >
                Enter Manually
              </Button>
            </div>
            {source === 'api' && (
              <Badge variant="secondary" className="mt-2">
                API integration coming soon - use manual entry for now
              </Badge>
            )}
          </div>

          {/* Manual Entry Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="gameDesc">Game Description *</Label>
              <Input
                id="gameDesc"
                placeholder="e.g., NE Patriots @ NY Jets 2024-09-14"
                value={gameDesc}
                onChange={(e) => setGameDesc(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="marketKey">Market *</Label>
              <Select value={marketKey} onValueChange={setMarketKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select market type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h2h">Moneyline (Head to Head)</SelectItem>
                  <SelectItem value="spreads">Point Spread</SelectItem>
                  <SelectItem value="totals">Total Points (Over/Under)</SelectItem>
                  <SelectItem value="props">Player Props</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="selection">Selection *</Label>
              <Input
                id="selection"
                placeholder="e.g., Patriots -3.5 or Tyreek Hill Over 89.5 Yds"
                value={selection}
                onChange={(e) => setSelection(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="line">Line (if applicable)</Label>
              <Input
                id="line"
                type="number"
                step="0.5"
                placeholder="e.g., -3.5, 45.5"
                value={line}
                onChange={(e) => setLine(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="americanOdds">American Odds *</Label>
              <Input
                id="americanOdds"
                type="number"
                placeholder="e.g., -110, +145"
                value={americanOdds}
                onChange={(e) => setAmericanOdds(e.target.value)}
              />
              {americanOdds && !isNaN(parseInt(americanOdds)) && (
                <p className="text-sm text-muted-foreground mt-1">
                  Decimal odds: {americanToDecimal(parseInt(americanOdds)).toFixed(3)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this bet..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Leg
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
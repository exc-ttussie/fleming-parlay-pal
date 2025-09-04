import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Leg } from '@/types/database';
import { americanToDecimal } from '@/lib/parlay';
import { isValidOdds } from '@/lib/oddsValidation';

interface EditLegModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leg: Leg | null;
  onLegUpdated: () => void;
}

const bookmakers = [
  'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 
  'BetRivers', 'WynnBET', 'Unibet', 'Barstool', 'Other'
];

export const EditLegModal = ({ open, onOpenChange, leg, onLegUpdated }: EditLegModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    game_desc: '',
    selection: '',
    american_odds: '',
    decimal_odds: 0,
    bookmaker: '',
    line: '',
    player_name: '',
    market_key: '',
    prop_category: ''
  });

  useEffect(() => {
    if (leg && open) {
      setFormData({
        game_desc: leg.game_desc,
        selection: leg.selection,
        american_odds: leg.american_odds.toString(),
        decimal_odds: leg.decimal_odds,
        bookmaker: leg.bookmaker,
        line: leg.line?.toString() || '',
        player_name: leg.player_name || '',
        market_key: leg.market_key,
        prop_category: leg.prop_category || ''
      });
    }
  }, [leg, open]);

  const handleOddsChange = (value: string) => {
    setFormData(prev => ({ ...prev, american_odds: value }));
    
    const odds = parseInt(value);
    if (isValidOdds(odds)) {
      const decimal = americanToDecimal(odds);
      setFormData(prev => ({ ...prev, decimal_odds: decimal }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leg) return;

    const odds = parseInt(formData.american_odds);
    if (!isValidOdds(odds)) {
      toast({
        title: "Invalid Odds",
        description: "Please enter valid American odds",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        game_desc: formData.game_desc,
        selection: formData.selection,
        american_odds: odds,
        decimal_odds: americanToDecimal(odds),
        bookmaker: formData.bookmaker,
        market_key: formData.market_key,
        player_name: formData.player_name || null,
        line: formData.line ? parseFloat(formData.line) : null,
        prop_category: formData.prop_category || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('legs')
        .update(updateData)
        .eq('id', leg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leg updated successfully"
      });
      
      onLegUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating leg:', error);
      toast({
        title: "Error",
        description: "Failed to update leg",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!leg) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Leg</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="game">Game Description</Label>
              <Input
                id="game"
                value={formData.game_desc}
                onChange={(e) => setFormData(prev => ({ ...prev, game_desc: e.target.value }))}
                placeholder="e.g., Chiefs vs Bills"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="selection">Selection</Label>
              <Input
                id="selection"
                value={formData.selection}
                onChange={(e) => setFormData(prev => ({ ...prev, selection: e.target.value }))}
                placeholder="e.g., Chiefs -3.5, Over 45.5"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odds">American Odds</Label>
              <Input
                id="odds"
                value={formData.american_odds}
                onChange={(e) => handleOddsChange(e.target.value)}
                placeholder="-110"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Decimal Odds</Label>
              <Input
                value={formData.decimal_odds.toFixed(2)}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bookmaker">Bookmaker</Label>
              <Select value={formData.bookmaker} onValueChange={(value) => setFormData(prev => ({ ...prev, bookmaker: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bookmaker" />
                </SelectTrigger>
                <SelectContent>
                  {bookmakers.map((book) => (
                    <SelectItem key={book} value={book}>
                      {book}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market">Market Key</Label>
              <Input
                id="market"
                value={formData.market_key}
                onChange={(e) => setFormData(prev => ({ ...prev, market_key: e.target.value }))}
                placeholder="e.g., spreads, totals, h2h"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="line">Line (Optional)</Label>
              <Input
                id="line"
                value={formData.line}
                onChange={(e) => setFormData(prev => ({ ...prev, line: e.target.value }))}
                placeholder="e.g., -3.5, 45.5"
              />
            </div>
          </div>

          {formData.player_name && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="player">Player Name</Label>
                <Input
                  id="player"
                  value={formData.player_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, player_name: e.target.value }))}
                  placeholder="Player name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Prop Category</Label>
                <Input
                  id="category"
                  value={formData.prop_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, prop_category: e.target.value }))}
                  placeholder="e.g., Passing, Rushing, Receiving"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Leg'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
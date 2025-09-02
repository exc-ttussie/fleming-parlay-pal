import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface CreateLegModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLegCreated: () => void;
}

export const CreateLegModal = ({ open, onOpenChange, onLegCreated }: CreateLegModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<{id: string, week_number: number} | null>(null);
  const [formData, setFormData] = useState({
    sport: '',
    league: '',
    game_date: '',
    team_a: '',
    team_b: '',
    bet_type: '',
    selection: '',
    odds: '',
    stake: '',
  });

  const resetForm = () => {
    setFormData({
      sport: '',
      league: '',
      game_date: '',
      team_a: '',
      team_b: '',
      bet_type: '',
      selection: '',
      odds: '',
      stake: '',
    });
  };

  // Fetch current open week
  const fetchCurrentWeek = async () => {
    try {
      const { data, error } = await supabase
        .from('weeks')
        .select('id, week_number')
        .eq('status', 'OPEN')
        .order('week_number', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      setCurrentWeek(data);
    } catch (error) {
      console.error('Error fetching current week:', error);
      toast({
        title: "Error",
        description: "No open week found for submissions",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    if (!currentWeek) {
      toast({
        title: "Error",
        description: "No open week available for submissions",
        variant: "destructive",
      });
      return false;
    }

    const americanOdds = parseInt(formData.odds);
    if (isNaN(americanOdds) || americanOdds < -10000 || americanOdds > 10000 || americanOdds === 0) {
      toast({
        title: "Invalid Odds",
        description: "American odds must be a number between -10000 and +10000 (excluding 0)",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a leg",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Convert American odds to decimal
      const americanOdds = parseInt(formData.odds);
      let decimalOdds;
      if (americanOdds > 0) {
        decimalOdds = (americanOdds / 100) + 1;
      } else {
        decimalOdds = (100 / Math.abs(americanOdds)) + 1;
      }

      const { error } = await supabase
        .from('legs')
        .insert({
          user_id: user.id,
          week_id: currentWeek!.id, // Use actual week ID
          sport_key: formData.sport.toLowerCase(),
          league: formData.league.trim(),
          game_desc: `${formData.team_a.trim()} vs ${formData.team_b.trim()}`,
          market_key: formData.bet_type,
          selection: formData.selection.trim(),
          american_odds: americanOdds,
          decimal_odds: decimalOdds,
          source: 'manual',
          bookmaker: 'Manual Entry',
          status: 'PENDING',
        });

      if (error) throw error;

      resetForm();
      onLegCreated();
      
    } catch (error: any) {
      console.error('Error creating leg:', error);
      toast({
        title: "Error",
        description: "Failed to create leg",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load current week when modal opens
  useEffect(() => {
    if (open) {
      fetchCurrentWeek();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add New Leg {currentWeek && `(Week ${currentWeek.week_number})`}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sport">Sport</Label>
            <Select value={formData.sport} onValueChange={(value) => handleChange('sport', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Football">Football</SelectItem>
                <SelectItem value="Basketball">Basketball</SelectItem>
                <SelectItem value="Baseball">Baseball</SelectItem>
                <SelectItem value="Hockey">Hockey</SelectItem>
                <SelectItem value="Soccer">Soccer</SelectItem>
                <SelectItem value="Tennis">Tennis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="league">League</Label>
            <Input
              id="league"
              value={formData.league}
              onChange={(e) => handleChange('league', e.target.value)}
              placeholder="e.g., NFL, NBA, MLB"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team_a">Team A</Label>
              <Input
                id="team_a"
                value={formData.team_a}
                onChange={(e) => handleChange('team_a', e.target.value)}
                placeholder="Home team"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team_b">Team B</Label>
              <Input
                id="team_b"
                value={formData.team_b}
                onChange={(e) => handleChange('team_b', e.target.value)}
                placeholder="Away team"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="game_date">Game Date</Label>
            <Input
              id="game_date"
              type="datetime-local"
              value={formData.game_date}
              onChange={(e) => handleChange('game_date', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bet_type">Bet Type</Label>
            <Select value={formData.bet_type} onValueChange={(value) => handleChange('bet_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select bet type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moneyline">Moneyline</SelectItem>
                <SelectItem value="spread">Spread</SelectItem>
                <SelectItem value="total">Total (Over/Under)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="selection">Selection</Label>
            <Input
              id="selection"
              value={formData.selection}
              onChange={(e) => handleChange('selection', e.target.value)}
              placeholder="e.g., Chiefs ML, Lakers -5.5, Over 48.5"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odds">Odds</Label>
              <Input
                id="odds"
                value={formData.odds}
                onChange={(e) => handleChange('odds', e.target.value)}
                placeholder="e.g., -110, +150"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stake">Stake ($)</Label>
              <Input
                id="stake"
                type="number"
                step="0.01"
                value={formData.stake}
                onChange={(e) => handleChange('stake', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Leg'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
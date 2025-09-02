import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { americanToDecimal } from '@/lib/parlay';

interface Game {
  id: string;
  external_game_id: string;
  sport: string;
  league: string;
  game_date: string;
  team_a: string;
  team_b: string;
  moneyline_home: number | null;
  moneyline_away: number | null;
  spread_home: number | null;
  spread_home_odds: number | null;
  spread_away: number | null;
  spread_away_odds: number | null;
  total_over: number | null;
  total_over_odds: number | null;
  total_under: number | null;
  total_under_odds: number | null;
  updated_at: string;
}

interface BetOption {
  type: 'moneyline' | 'spread' | 'total';
  selection: string;
  odds: number;
  line?: number;
  description: string;
}

interface EnhancedCreateLegModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLegCreated: () => void;
  weekId: string;
}

export const EnhancedCreateLegModal = ({ 
  open, 
  onOpenChange, 
  onLegCreated,
  weekId 
}: EnhancedCreateLegModalProps) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [fetchingOdds, setFetchingOdds] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedBet, setSelectedBet] = useState<BetOption | null>(null);

  // Fetch available games
  const fetchGames = async () => {
    try {
      setFetchingOdds(true);
      
      console.log('Fetching NFL odds...');
      
      // First, refresh odds from API
      const { data: functionData, error: functionError } = await supabase.functions.invoke('fetch-odds');
      
      if (functionError) {
        console.error('Function error:', functionError);
        toast.error('Failed to refresh odds from API');
      } else if (functionData) {
        console.log('Function response:', functionData);
        if (!functionData.success) {
          toast.error(functionData.error || 'Failed to fetch odds');
        } else if (!functionData.api_success) {
          toast.info('Using backup game data - live odds temporarily unavailable');
        } else if (functionData.rate_limit?.requests_remaining !== null) {
          console.log(`API requests remaining: ${functionData.rate_limit.requests_remaining}`);
        }
      }
      
      // Then fetch NFL games from cache (including preseason)
      // Only show games within the next 7 days to keep it relevant
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { data, error } = await supabase
        .from('odds_cache')
        .select('*')
        .in('league', ['AMERICANFOOTBALL NFL', 'AMERICANFOOTBALL NFL PRESEASON'])
        .gte('game_date', new Date().toISOString())
        .lte('game_date', nextWeek.toISOString())
        .order('game_date', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} NFL games from cache`);
      setGames(data || []);
      
      if (!data || data.length === 0) {
        toast.error('No NFL games available. Please try again later or contact support if the issue persists.');
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to fetch NFL games. Please check your connection and try again.');
    } finally {
      setFetchingOdds(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGames();
    }
  }, [open]);

  // Get available bet options for selected game
  const getBetOptions = (game: Game): BetOption[] => {
    const options: BetOption[] = [];

    // Moneyline options
    if (game.moneyline_home) {
      options.push({
        type: 'moneyline',
        selection: `${game.team_a} ML`,
        odds: game.moneyline_home,
        description: `${game.team_a} to win`
      });
    }
    if (game.moneyline_away) {
      options.push({
        type: 'moneyline',
        selection: `${game.team_b} ML`,
        odds: game.moneyline_away,
        description: `${game.team_b} to win`
      });
    }

    // Spread options
    if (game.spread_home && game.spread_home_odds) {
      const spread = game.spread_home > 0 ? `+${game.spread_home}` : game.spread_home;
      options.push({
        type: 'spread',
        selection: `${game.team_a} ${spread}`,
        odds: game.spread_home_odds,
        line: game.spread_home,
        description: `${game.team_a} ${spread}`
      });
    }
    if (game.spread_away && game.spread_away_odds) {
      const spread = game.spread_away > 0 ? `+${game.spread_away}` : game.spread_away;
      options.push({
        type: 'spread',
        selection: `${game.team_b} ${spread}`,
        odds: game.spread_away_odds,
        line: game.spread_away,
        description: `${game.team_b} ${spread}`
      });
    }

    // Total options
    if (game.total_over && game.total_over_odds) {
      options.push({
        type: 'total',
        selection: `Over ${game.total_over}`,
        odds: game.total_over_odds,
        line: game.total_over,
        description: `Over ${game.total_over} total points`
      });
    }
    if (game.total_under && game.total_under_odds) {
      options.push({
        type: 'total',
        selection: `Under ${game.total_under}`,
        odds: game.total_under_odds,
        line: game.total_under,
        description: `Under ${game.total_under} total points`
      });
    }

    return options;
  };

  const handleSubmitLeg = async () => {
    if (!user || !selectedGame || !selectedBet) {
      toast.error('Please select a game and bet');
      return;
    }

    setLoading(true);
    
    try {
      // Check if user already has a leg for this week
      const { data: existingLeg, error: checkError } = await supabase
        .from('legs')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_id', weekId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing leg:', checkError);
        throw new Error('Failed to verify submission eligibility');
      }

      if (existingLeg) {
        toast.error('You have already submitted a leg for this week. Only one submission per week is allowed.');
        return;
      }

      const decimalOdds = americanToDecimal(selectedBet.odds);

      const { error } = await supabase
        .from('legs')
        .insert({
          user_id: user.id,
          week_id: weekId,
          sport_key: selectedGame.sport.toLowerCase().replace(' ', '_'),
          league: selectedGame.league,
          game_id: selectedGame.external_game_id,
          game_desc: `${selectedGame.team_a} vs ${selectedGame.team_b}`,
          market_key: selectedBet.type,
          selection: selectedBet.selection,
          line: selectedBet.line,
          american_odds: selectedBet.odds,
          decimal_odds: decimalOdds,
          source: 'odds_api',
          bookmaker: 'DraftKings',
          status: 'PENDING'
        });

      if (error) {
        if (error.code === '23505' && error.message?.includes('unique_user_week_leg')) {
          toast.error('You have already submitted a leg for this week.');
          return;
        }
        throw error;
      }

      toast.success('Leg submitted successfully!');
      onLegCreated();
      onOpenChange(false);
      
      // Reset selections
      setSelectedGame(null);
      setSelectedBet(null);
      
    } catch (error: any) {
      console.error('Error creating leg:', error);
      toast.error('Failed to submit leg');
    } finally {
      setLoading(false);
    }
  };


  const formatOdds = (odds: number) => odds > 0 ? `+${odds}` : `${odds}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-primary font-bold">LET THE DEED SHAW</span> - NFL Betting
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchGames}
            disabled={fetchingOdds}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${fetchingOdds ? 'animate-spin' : ''}`} />
            Refresh Odds
          </Button>
        </DialogHeader>
        
        {fetchingOdds ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Fetching live odds...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Game Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select an NFL Game</h3>
              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {games.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No NFL games available at the moment.</p>
                    <p className="text-sm mt-2">Try refreshing odds or check back later.</p>
                  </div>
                ) : (
                  games.map((game) => (
                  <Card 
                    key={game.id}
                    className={`cursor-pointer transition-colors ${
                      selectedGame?.id === game.id ? 'ring-2 ring-primary bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedGame(game)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-lg">
                            {game.team_a} vs {game.team_b}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(game.game_date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })} at{' '}
                            {new Date(game.game_date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-gradient-to-r from-blue-600 to-red-600 text-white border-0">
                            NFL
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Bet Options */}
            {selectedGame && (
              <div className="space-y-4">
                <Separator />
                <h3 className="text-lg font-semibold">Available Bets</h3>
                <div className="grid gap-3">
                  {getBetOptions(selectedGame).map((bet, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-colors ${
                        selectedBet === bet ? 'ring-2 ring-primary bg-accent' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedBet(bet)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{bet.description}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {bet.type} bet
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg">
                              {formatOdds(bet.odds)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              DraftKings
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Summary */}
            {selectedGame && selectedBet && (
              <div className="space-y-4">
                <Separator />
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Your Selection</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Game:</span> {selectedGame.team_a} vs {selectedGame.team_b}
                    </div>
                    <div>
                      <span className="font-medium">Bet:</span> {selectedBet.description}
                    </div>
                    <div>
                      <span className="font-medium">Odds:</span> {formatOdds(selectedBet.odds)}
                    </div>
                    <div>
                      <span className="font-medium">Stake:</span> $10.00 (group parlay)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitLeg}
                disabled={loading || !selectedGame || !selectedBet}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Leg'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, User, BarChart3, Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { americanToDecimal } from '@/lib/parlay';
import { isValidOdds, isValidLine, isValidPlayerPropPrice, formatOdds } from '@/lib/oddsValidation';

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
  player_props: PlayerPropsData;
  updated_at: string;
}

interface PlayerProp {
  player_name: string;
  market_key: string;
  category: string;
  point: number | null;
  price: number;
  bookmaker: string;
  description?: string;
  over_price?: number;
  under_price?: number;
}

interface PlayerPropsData {
  [category: string]: {
    [market_key: string]: {
      [player_name: string]: PlayerProp;
    };
  };
}

interface BetOption {
  type: 'moneyline' | 'spread' | 'total' | 'player_prop';
  selection: string;
  odds: number;
  line?: number;
  description: string;
  player_name?: string;
  prop_type?: string;
  prop_category?: string;
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
  const [activeTab, setActiveTab] = useState<'game' | 'props'>('game');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [playerSearch, setPlayerSearch] = useState<string>('');

  // Fetch available games
  const fetchGames = async () => {
    try {
      console.log('Invoking fetch-odds to refresh data...');
      setFetchingOdds(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-odds', {
        body: {}
      });
      
      if (error) {
        console.error('Error refreshing odds:', error);
        toast.error('Failed to refresh odds. Using cached data.');
      } else {
        console.log('Odds refresh result:', data);
        
        if (data?.success === false) {
          // Handle different error types with appropriate messages
          if (data?.error === 'API Authentication Failed') {
            toast.error('Live odds unavailable: API key invalid. Using cached data.');
          } else if (data?.error === 'API Quota Exceeded') {
            toast.error('Live odds unavailable: API quota exceeded. Using cached data.');
          } else if (data?.error === 'No Upcoming Games') {
            toast.info('No upcoming NFL games found in next 14 days.');
          } else {
            toast.error(`Live odds unavailable: ${data?.message || 'Unknown error'}. Using cached data.`);
          }
        } else if (data?.api_success === false) {
          toast.info('Live odds unavailable: Using test data with comprehensive player props');
        } else if (data?.success) {
          toast.success(data?.message || 'Live odds updated successfully');
        }
      }
      
      // Now fetch the updated games
      const { data: gamesData, error: gamesError } = await supabase
        .from('odds_cache')
        .select('*')
        .eq('sport', 'American Football')
        .gt('game_date', new Date().toISOString())
        .lt('game_date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
        .order('game_date', { ascending: true });
      
      if (gamesError) {
        console.error('Error fetching games:', gamesError);
        toast.error('Failed to fetch updated games');
        return;
      }
      
      // Check if cache is empty and attempt to populate it
      if (!gamesData || gamesData.length === 0) {
        console.log('⚠️ No games found in cache, calling fetch-odds function...');
        toast.info('No games in cache, fetching fresh data...');
        
        try {
          const { data: functionData, error: functionError } = await supabase.functions.invoke('fetch-odds', {});
          
          if (functionError) {
            console.error('Error calling fetch-odds function:', functionError);
            toast.error(`Failed to fetch fresh odds: ${functionError.message}`);
            return;
          }
          
          console.log('✅ Fetch-odds function response:', functionData);
          
          if (functionData?.success === false) {
            console.error('Fetch-odds function returned error:', functionData.message);
            toast.error(`Odds fetch failed: ${functionData.message || 'Unknown error'}`);
            return;
          }
          
          toast.success(`Fetched ${functionData?.games_processed || 0} games successfully`);
          
          // Retry the query after fetching fresh data
          const { data: retryData, error: retryError } = await supabase
            .from('odds_cache')
            .select('*')
            .eq('sport', 'American Football')
            .gt('game_date', new Date().toISOString())
            .lt('game_date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
            .order('game_date', { ascending: true });
            
          if (retryError) {
            console.error('Error on retry:', retryError);
            toast.error('Failed to load games after refresh');
            return;
          }
          
          const retryGamesData = retryData;
          
          if (!retryGamesData || retryGamesData.length === 0) {
            console.log('⚠️ Still no games found after fetch-odds call');
            toast.warning('No NFL games available for the next 14 days. Check back closer to game day.');
            setGames([]);
            return;
          }
          
          console.log(`✅ Successfully loaded ${retryGamesData.length} games after refresh`);
          setGames(retryGamesData.map(game => ({
            ...game,
            player_props: (game.player_props as unknown as PlayerPropsData) || {}
          })));
          return;
          
        } catch (fetchError) {
          console.error('Error calling fetch-odds function:', fetchError);
          toast.error(`Could not fetch fresh game data: ${fetchError.message || 'Network error'}`);
          setGames([]);
          return;
        }
      } else {
        console.log(`Fetched ${gamesData?.length || 0} games from database`);
        
        // Enhanced debugging for player props
        let gamesWithProps = 0;
        let totalPropCategories = 0;
        let dolphinsGame = null;
        let tuaPropsFound = false;
        
        gamesData?.forEach(game => {
          const propCategories = Object.keys(game.player_props || {}).length;
          if (propCategories > 0) {
            gamesWithProps++;
            totalPropCategories += propCategories;
            console.log(`✓ ${game.team_a} vs ${game.team_b}: ${propCategories} prop categories available`);
            
            // Check for Tua's props specifically
            const passingProps = game.player_props?.['Passing']?.['player_pass_yds'];
            if (passingProps?.['Tua Tagovailoa']) {
              tuaPropsFound = true;
              console.log(`🎯 Found Tua Tagovailoa passing yards prop: Over/Under ${passingProps['Tua Tagovailoa'].point} at ${passingProps['Tua Tagovailoa'].price}`);
            }
          } else {
            const gameTime = new Date(game.game_date);
            const hoursUntilGame = (gameTime.getTime() - Date.now()) / (1000 * 60 * 60);
            console.log(`✗ ${game.team_a} vs ${game.team_b}: No props (${Math.round(hoursUntilGame)}h until kickoff)`);
          }
          
          // Check for Dolphins games specifically
          if (game.team_a?.includes('Dolphins') || game.team_b?.includes('Dolphins')) {
            dolphinsGame = game;
            console.log(`🐬 Found Dolphins game: ${game.team_a} vs ${game.team_b}`);
            console.log(`🐬 Props available: ${Object.keys(game.player_props || {}).length} categories`);
            if (game.player_props && Object.keys(game.player_props).length > 0) {
              console.log(`🐬 Player props preview:`, Object.keys(game.player_props));
            }
          }
        });
        
        console.log(`\n📊 DATABASE PROPS SUMMARY:`);
        console.log(`Total games: ${gamesData?.length || 0}`);
        console.log(`Games with props: ${gamesWithProps}`);
        console.log(`Total prop categories: ${totalPropCategories}`);
        console.log(`Dolphins game found: ${!!dolphinsGame}`);
        console.log(`Tua props found: ${tuaPropsFound}`);
        
        if (tuaPropsFound) {
          console.log('🎯 SUCCESS: Tua Tagovailoa passing yards prop is available for testing!');
          toast.success('Found Tua\'s passing yards prop - ready for testing!');
        } else if (dolphinsGame) {
          console.log('⚠️ Dolphins game exists but no Tua props found');
        }
        
        setGames((gamesData || []).map(game => ({
          ...game,
          player_props: (game.player_props as unknown as PlayerPropsData) || {}
        })));
        
        // Show additional info in toast for user awareness
        if (data?.api_success === false && gamesWithProps > 0) {
          toast.info(`Using ${gamesData?.length || 0} test games with comprehensive player props for demo/testing`);
        } else if (gamesWithProps === 0) {
          toast.error('No games with player props available. This may be because games are too far in the future.');
        }
      }
    } catch (err) {
      console.error('Error in fetchGames:', err);
      toast.error('Failed to fetch games');
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
    if (isValidOdds(game.moneyline_home)) {
      options.push({
        type: 'moneyline',
        selection: `${game.team_a} ML`,
        odds: game.moneyline_home,
        description: `${game.team_a} to win`
      });
    }
    if (isValidOdds(game.moneyline_away)) {
      options.push({
        type: 'moneyline',
        selection: `${game.team_b} ML`,
        odds: game.moneyline_away,
        description: `${game.team_b} to win`
      });
    }

    // Spread options
    if (isValidLine(game.spread_home) && isValidOdds(game.spread_home_odds)) {
      const spread = game.spread_home > 0 ? `+${game.spread_home}` : game.spread_home;
      options.push({
        type: 'spread',
        selection: `${game.team_a} ${spread}`,
        odds: game.spread_home_odds,
        line: game.spread_home,
        description: `${game.team_a} ${spread}`
      });
    }
    if (isValidLine(game.spread_away) && isValidOdds(game.spread_away_odds)) {
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
    if (isValidLine(game.total_over) && isValidOdds(game.total_over_odds)) {
      options.push({
        type: 'total',
        selection: `Over ${game.total_over}`,
        odds: game.total_over_odds,
        line: game.total_over,
        description: `Over ${game.total_over} total points`
      });
    }
    if (isValidLine(game.total_under) && isValidOdds(game.total_under_odds)) {
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

  // Get player prop options for selected game
  const getPlayerPropOptions = (game: Game): BetOption[] => {
    const options: BetOption[] = [];
    
    if (!game.player_props) return options;

      Object.entries(game.player_props).forEach(([category, markets]) => {
        // Filter by selected category if one is selected
        if (selectedCategory && selectedCategory !== 'all' && category !== selectedCategory) return;

      Object.entries(markets).forEach(([marketKey, players]) => {
        Object.entries(players).forEach(([playerName, prop]) => {
          // Filter by player search if search term exists
          if (playerSearch && !playerName.toLowerCase().includes(playerSearch.toLowerCase())) return;

          // Handle Over/Under props with both prices
          if (isValidLine(prop.point)) {
            // Create both Over and Under options if available
            if (isValidPlayerPropPrice(prop.over_price)) {
              options.push({
                type: 'player_prop',
                selection: `${playerName} ${formatPropName(marketKey)} Over ${prop.point}`,
                odds: prop.over_price,
                line: prop.point,
                description: `${playerName} ${formatPropName(marketKey)} Over ${prop.point}`,
                player_name: playerName,
                prop_type: marketKey,
                prop_category: category
              });
            }
            
            if (isValidPlayerPropPrice(prop.under_price)) {
              options.push({
                type: 'player_prop',
                selection: `${playerName} ${formatPropName(marketKey)} Under ${prop.point}`,
                odds: prop.under_price,
                line: -prop.point, // Negative to indicate Under
                description: `${playerName} ${formatPropName(marketKey)} Under ${prop.point}`,
                player_name: playerName,
                prop_type: marketKey,
                prop_category: category
              });
            }
            
            // Fallback: if no specific over/under prices, use the main price as Over
            if (!isValidPlayerPropPrice(prop.over_price) && !isValidPlayerPropPrice(prop.under_price) && isValidPlayerPropPrice(prop.price)) {
              const description = `${playerName} ${formatPropName(marketKey)} Over ${prop.point}`;
              options.push({
                type: 'player_prop',
                selection: description,
                odds: prop.price,
                line: prop.point,
                description,
                player_name: playerName,
                prop_type: marketKey,
                prop_category: category
              });
            }
          } else if (isValidPlayerPropPrice(prop.price)) {
            // For props without points (like anytime TD)
            const description = `${playerName} ${formatPropName(marketKey)}`;
            options.push({
              type: 'player_prop',
              selection: description,
              odds: prop.price,
              line: prop.point,
              description,
              player_name: playerName,
              prop_type: marketKey,
              prop_category: category
            });
          }

        });
      });
    });

    return options.sort((a, b) => (a.player_name || '').localeCompare(b.player_name || ''));
  };

  // Format prop names for display
  const formatPropName = (marketKey: string): string => {
    const formatMap: { [key: string]: string } = {
      'player_pass_yds': 'Passing Yards',
      'player_pass_tds': 'Passing TDs',
      'player_pass_completions': 'Completions',
      'player_pass_attempts': 'Pass Attempts',
      'player_pass_interceptions': 'Interceptions',
      'player_rush_yds': 'Rushing Yards',
      'player_rush_tds': 'Rushing TDs',
      'player_rush_attempts': 'Rush Attempts',
      'player_receptions': 'Receptions',
      'player_reception_yds': 'Receiving Yards',
      'player_reception_tds': 'Receiving TDs',
      'player_anytime_td': 'Anytime TD',
      'player_1st_td': 'First TD',
      'player_sacks': 'Sacks',
      'player_tackles_assists': 'Tackles + Assists',
      'player_field_goals': 'Field Goals',
      'player_kicking_points': 'Kicking Points',
      'player_pass_rush_reception_yds': 'Pass + Rush + Rec Yards',
      'player_rush_reception_yds': 'Rush + Rec Yards'
    };
    return formatMap[marketKey] || marketKey.replace(/_/g, ' ');
  };

  // Get available categories for current game
  const getAvailableCategories = (game: Game): string[] => {
    if (!game.player_props) return [];
    return Object.keys(game.player_props);
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

      const legData: any = {
        user_id: user.id,
        week_id: weekId,
        sport_key: selectedGame.sport.toLowerCase().replace(' ', '_'),
        league: selectedGame.league,
        game_id: selectedGame.external_game_id,
        game_desc: `${selectedGame.team_a} vs ${selectedGame.team_b}`,
        market_key: selectedBet.type === 'player_prop' ? selectedBet.prop_type : selectedBet.type,
        selection: selectedBet.selection,
        line: selectedBet.line,
        american_odds: selectedBet.odds,
        decimal_odds: decimalOdds,
        source: 'odds_api',
        bookmaker: 'DraftKings',
        status: 'PENDING'
      };

      // Add player prop specific fields
      if (selectedBet.type === 'player_prop') {
        legData.player_name = selectedBet.player_name;
        legData.prop_type = selectedBet.prop_type;
        legData.prop_category = selectedBet.prop_category;
      }

      const { error } = await supabase
        .from('legs')
        .insert(legData);

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
      setActiveTab('game');
      setSelectedCategory('all');
      setPlayerSearch('');
      
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
          <DialogDescription className="sr-only">
            Select an NFL game and place your bet to add a leg to the group parlay
          </DialogDescription>
          <DialogDescription className="sr-only">
            Select an NFL game and bet type to submit your leg for this week's parlay
          </DialogDescription>
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
                      onClick={() => {
                        setSelectedGame(game);
                        setSelectedBet(null);
                        setActiveTab('game');
                        setSelectedCategory('all');
                        setPlayerSearch('');
                      }}
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

            {/* Betting Options */}
            {selectedGame && (
              <div className="space-y-4">
                <Separator />
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'game' | 'props')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="game" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Game Props
                    </TabsTrigger>
                    <TabsTrigger value="props" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Player Props
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="game" className="space-y-4">
                    <h3 className="text-lg font-semibold">Game Betting Options</h3>
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
                  </TabsContent>

                  <TabsContent value="props" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Player Props</h3>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search players..."
                            value={playerSearch}
                            onChange={(e) => setPlayerSearch(e.target.value)}
                            className="pl-8 w-64"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category Filter */}
                    {getAvailableCategories(selectedGame).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Filter by Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {getAvailableCategories(selectedGame).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Player Props List */}
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                      {getPlayerPropOptions(selectedGame).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground space-y-3">
                          <div>
                            <p className="font-medium">No player props available for this game</p>
                            {(() => {
                              const gameTime = new Date(selectedGame.game_date);
                              const hoursUntilGame = (gameTime.getTime() - Date.now()) / (1000 * 60 * 60);
                              const lastUpdated = new Date(selectedGame.updated_at);
                              
                              if (hoursUntilGame > 48) {
                                return (
                                  <div className="text-sm mt-2 space-y-1">
                                    <p>Player props typically become available 24-48 hours before kickoff.</p>
                                    <p className="text-xs">Game starts in {Math.round(hoursUntilGame)} hours</p>
                                  </div>
                                );
                              } else if (hoursUntilGame > 0) {
                                return (
                                  <div className="text-sm mt-2 space-y-1">
                                    <p>Props should be available soon. Try refreshing odds.</p>
                                    <p className="text-xs">Game starts in {Math.round(hoursUntilGame)} hours</p>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-sm mt-2">
                                    <p>Game has already started - props are no longer available.</p>
                                  </div>
                                );
                              }
                            })()}
                            <p className="text-xs text-muted-foreground/60 mt-2">
                              Last updated: {new Date(selectedGame.updated_at).toLocaleTimeString()}
                            </p>
                          </div>
                          {playerSearch || selectedCategory ? (
                            <div className="pt-2 border-t border-border/50">
                              <p className="text-xs">Try clearing filters or selecting a different game.</p>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        getPlayerPropOptions(selectedGame).map((bet, index) => (
                          <Card
                            key={index}
                            className={`cursor-pointer transition-colors ${
                              selectedBet === bet ? 'ring-2 ring-primary bg-accent' : 'hover:bg-accent/50'
                            }`}
                            onClick={() => setSelectedBet(bet)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{bet.description}</div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {bet.prop_category}
                                    </Badge>
                                    <span>{bet.player_name}</span>
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
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
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
                    {selectedBet.type === 'player_prop' && (
                      <div>
                        <span className="font-medium">Category:</span> {selectedBet.prop_category}
                      </div>
                    )}
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
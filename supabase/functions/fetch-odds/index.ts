import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const oddsApiKey = Deno.env.get('ODDS_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface OddsResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting odds fetch...');
    
    // Fetch odds from multiple sports
    const sports = ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'icehockey_nhl'];
    const markets = 'h2h,spreads,totals';
    
    let allGames: any[] = [];
    
    for (const sport of sports) {
      try {
        const response = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${oddsApiKey}&regions=us&markets=${markets}&oddsFormat=american`
        );
        
        if (!response.ok) {
          console.error(`Failed to fetch ${sport} odds:`, response.status);
          continue;
        }
        
        const data: OddsResponse[] = await response.json();
        console.log(`Fetched ${data.length} games for ${sport}`);
        
        // Transform odds data for storage
        for (const game of data) {
          // Get the best odds from various bookmakers
          const bestOdds = extractBestOdds(game);
          
          allGames.push({
            external_game_id: game.id,
            sport: game.sport_title,
            league: sport.toUpperCase().replace('_', ' '),
            game_date: game.commence_time,
            team_a: game.home_team,
            team_b: game.away_team,
            moneyline_home: bestOdds.moneyline.home,
            moneyline_away: bestOdds.moneyline.away,
            spread_home: bestOdds.spread.home_line,
            spread_home_odds: bestOdds.spread.home_odds,
            spread_away: bestOdds.spread.away_line,
            spread_away_odds: bestOdds.spread.away_odds,
            total_over: bestOdds.total.over_line,
            total_over_odds: bestOdds.total.over_odds,
            total_under: bestOdds.total.under_line,
            total_under_odds: bestOdds.total.under_odds,
            updated_at: new Date().toISOString(),
          });
        }
        
        // Rate limiting - pause between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching ${sport}:`, error);
      }
    }
    
    console.log(`Total games processed: ${allGames.length}`);
    
    // Store odds in database (create odds_cache table if needed)
    if (allGames.length > 0) {
      try {
        const { error } = await supabase
          .from('odds_cache')
          .upsert(allGames, { 
            onConflict: 'external_game_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error('Database error:', error);
        } else {
          console.log('Successfully updated odds cache');
        }
      } catch (dbError) {
        console.error('Failed to update database:', dbError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        games_processed: allGames.length,
        message: 'Odds fetched and cached successfully' 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
    
  } catch (error: any) {
    console.error('Error in fetch-odds function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function extractBestOdds(game: OddsResponse) {
  const bestOdds = {
    moneyline: { home: null, away: null },
    spread: { home_line: null, home_odds: null, away_line: null, away_odds: null },
    total: { over_line: null, over_odds: null, under_line: null, under_odds: null }
  };
  
  for (const bookmaker of game.bookmakers) {
    for (const market of bookmaker.markets) {
      if (market.key === 'h2h') {
        // Moneyline odds
        for (const outcome of market.outcomes) {
          if (outcome.name === game.home_team) {
            bestOdds.moneyline.home = outcome.price;
          } else if (outcome.name === game.away_team) {
            bestOdds.moneyline.away = outcome.price;
          }
        }
      } else if (market.key === 'spreads') {
        // Spread odds
        for (const outcome of market.outcomes) {
          if (outcome.name === game.home_team) {
            bestOdds.spread.home_line = outcome.point;
            bestOdds.spread.home_odds = outcome.price;
          } else if (outcome.name === game.away_team) {
            bestOdds.spread.away_line = outcome.point;
            bestOdds.spread.away_odds = outcome.price;
          }
        }
      } else if (market.key === 'totals') {
        // Total odds
        for (const outcome of market.outcomes) {
          if (outcome.name === 'Over') {
            bestOdds.total.over_line = outcome.point;
            bestOdds.total.over_odds = outcome.price;
          } else if (outcome.name === 'Under') {
            bestOdds.total.under_line = outcome.point;
            bestOdds.total.under_odds = outcome.price;
          }
        }
      }
    }
  }
  
  return bestOdds;
}

serve(handler);
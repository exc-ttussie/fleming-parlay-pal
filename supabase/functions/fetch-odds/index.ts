import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const oddsApiKey = Deno.env.get('ODDS_API_KEY')!;

// Use service role key for database writes (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Fallback NFL preseason games for testing when API is unavailable
const fallbackGames = [
  {
    external_game_id: 'test-game-1',
    sport: 'American Football',
    league: 'AMERICANFOOTBALL NFL PRESEASON',
    game_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    team_a: 'Kansas City Chiefs',
    team_b: 'Buffalo Bills',
    moneyline_home: -150,
    moneyline_away: 130,
    spread_home: -3.5,
    spread_home_odds: -110,
    spread_away: 3.5,
    spread_away_odds: -110,
    total_over: 42.5,
    total_over_odds: -110,
    total_under: 42.5,
    total_under_odds: -110,
    player_props: {
      'Passing': {
        'player_pass_yds': {
          'Patrick Mahomes': { player_name: 'Patrick Mahomes', market_key: 'player_pass_yds', category: 'Passing', point: 275.5, price: -110, bookmaker: 'draftkings' },
          'Josh Allen': { player_name: 'Josh Allen', market_key: 'player_pass_yds', category: 'Passing', point: 267.5, price: -115, bookmaker: 'draftkings' }
        },
        'player_pass_tds': {
          'Patrick Mahomes': { player_name: 'Patrick Mahomes', market_key: 'player_pass_tds', category: 'Passing', point: 1.5, price: -125, bookmaker: 'draftkings' },
          'Josh Allen': { player_name: 'Josh Allen', market_key: 'player_pass_tds', category: 'Passing', point: 1.5, price: -105, bookmaker: 'draftkings' }
        }
      },
      'Rushing': {
        'player_rush_yds': {
          'Josh Allen': { player_name: 'Josh Allen', market_key: 'player_rush_yds', category: 'Rushing', point: 42.5, price: -110, bookmaker: 'draftkings' },
          'Isiah Pacheco': { player_name: 'Isiah Pacheco', market_key: 'player_rush_yds', category: 'Rushing', point: 67.5, price: -115, bookmaker: 'draftkings' }
        }
      },
      'Receiving': {
        'player_reception_yds': {
          'Travis Kelce': { player_name: 'Travis Kelce', market_key: 'player_reception_yds', category: 'Receiving', point: 67.5, price: -120, bookmaker: 'draftkings' },
          'Stefon Diggs': { player_name: 'Stefon Diggs', market_key: 'player_reception_yds', category: 'Receiving', point: 74.5, price: -110, bookmaker: 'draftkings' }
        }
      },
      'Touchdowns': {
        'player_anytime_td': {
          'Travis Kelce': { player_name: 'Travis Kelce', market_key: 'player_anytime_td', category: 'Touchdowns', point: null, price: 120, bookmaker: 'draftkings' },
          'Stefon Diggs': { player_name: 'Stefon Diggs', market_key: 'player_anytime_td', category: 'Touchdowns', point: null, price: 135, bookmaker: 'draftkings' }
        }
      }
    },
    updated_at: new Date().toISOString(),
  },
  {
    external_game_id: 'test-game-2',
    sport: 'American Football',
    league: 'AMERICANFOOTBALL NFL PRESEASON',
    game_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    team_a: 'Dallas Cowboys',
    team_b: 'Philadelphia Eagles',
    moneyline_home: 105,
    moneyline_away: -125,
    spread_home: 1.5,
    spread_home_odds: -110,
    spread_away: -1.5,
    spread_away_odds: -110,
    total_over: 38.5,
    total_over_odds: -105,
    total_under: 38.5,
    total_under_odds: -115,
    player_props: {
      'Passing': {
        'player_pass_yds': {
          'Dak Prescott': { player_name: 'Dak Prescott', market_key: 'player_pass_yds', category: 'Passing', point: 245.5, price: -110, bookmaker: 'draftkings' },
          'Jalen Hurts': { player_name: 'Jalen Hurts', market_key: 'player_pass_yds', category: 'Passing', point: 225.5, price: -115, bookmaker: 'draftkings' }
        }
      },
      'Rushing': {
        'player_rush_yds': {
          'Jalen Hurts': { player_name: 'Jalen Hurts', market_key: 'player_rush_yds', category: 'Rushing', point: 47.5, price: -110, bookmaker: 'draftkings' },
          'Ezekiel Elliott': { player_name: 'Ezekiel Elliott', market_key: 'player_rush_yds', category: 'Rushing', point: 52.5, price: -105, bookmaker: 'draftkings' }
        }
      }
    },
    updated_at: new Date().toISOString(),
  }
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting NFL odds fetch...');
    console.log('API Key available:', !!oddsApiKey);
    
    // Focus on NFL-only sports for better performance and lower API costs
    const sports = ['americanfootball_nfl', 'americanfootball_nfl_preseason'];
    const basicMarkets = 'h2h,spreads,totals';
    
    // NFL Player prop markets available from The Odds API
    const playerPropMarkets = [
      'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts',
      'player_pass_interceptions', 'player_rush_yds', 'player_rush_tds', 'player_rush_attempts',
      'player_receptions', 'player_reception_yds', 'player_reception_tds', 'player_anytime_td',
      'player_1st_td', 'player_sacks', 'player_tackles_assists', 'player_field_goals',
      'player_kicking_points', 'player_pass_rush_reception_yds', 'player_rush_reception_yds'
    ].join(',');
    
    let allGames: any[] = [];
    let apiSuccess = false;
    let apiRateLimit = { requests_remaining: null, requests_used: null };
    
    for (const sport of sports) {
      try {
        console.log(`Fetching ${sport} odds...`);
        
        const apiUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${oddsApiKey}&regions=us&markets=${basicMarkets}&oddsFormat=american`;
        console.log(`API URL: ${apiUrl.replace(oddsApiKey, '[HIDDEN]')}`);
        
        const response = await fetch(apiUrl);
        
        console.log(`API Response status for ${sport}:`, response.status);
        
        // Extract rate limit headers
        const remainingRequests = response.headers.get('x-requests-remaining');
        const usedRequests = response.headers.get('x-requests-used');
        if (remainingRequests) apiRateLimit.requests_remaining = parseInt(remainingRequests);
        if (usedRequests) apiRateLimit.requests_used = parseInt(usedRequests);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch ${sport} odds:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          continue;
        }
        
        const data: OddsResponse[] = await response.json();
        console.log(`Successfully fetched ${data.length} games for ${sport}`);
        apiSuccess = true;
        
        // Transform odds data for storage
        for (const game of data) {
          console.log(`Processing game: ${game.home_team} vs ${game.away_team}`);
          
          // Get the best odds from various bookmakers
          const bestOdds = extractBestOdds(game);
          
          // Create proper league name format
          let leagueName = 'AMERICANFOOTBALL NFL';
          if (sport === 'americanfootball_nfl_preseason') {
            leagueName = 'AMERICANFOOTBALL NFL PRESEASON';
          }
          
          // Fetch player props for this specific game
          let playerProps = {};
          try {
            console.log(`Fetching player props for game: ${game.id}`);
            const playerPropsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events/${game.id}/odds/?apiKey=${oddsApiKey}&regions=us&markets=${playerPropMarkets}&oddsFormat=american`;
            const playerPropsResponse = await fetch(playerPropsUrl);
            
            if (playerPropsResponse.ok) {
              const playerPropsData = await playerPropsResponse.json();
              playerProps = extractPlayerProps(playerPropsData);
              console.log(`Fetched ${Object.keys(playerProps).length} player prop categories for ${game.home_team} vs ${game.away_team}`);
            } else {
              console.log(`No player props available for ${game.home_team} vs ${game.away_team}`);
            }
            
            // Rate limiting between player prop calls
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Error fetching player props for game ${game.id}:`, error);
          }
          
          allGames.push({
            external_game_id: game.id,
            sport: game.sport_title,
            league: leagueName,
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
            player_props: playerProps,
            updated_at: new Date().toISOString(),
          });
        }
        
        // Rate limiting - pause between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching ${sport}:`, error);
      }
    }
    
    // If no games were fetched from API, use fallback data
    if (!apiSuccess || allGames.length === 0) {
      console.log('No games from API, using fallback data');
      allGames = [...fallbackGames];
    }
    
    console.log(`Total games processed: ${allGames.length}`);
    
    // Clear old games before inserting new ones (keep cache fresh)
    try {
      console.log('Clearing old odds cache...');
      const { error: deleteError } = await supabase
        .from('odds_cache')
        .delete()
        .lt('updated_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()); // Delete games older than 6 hours
      
      if (deleteError) {
        console.error('Error clearing old cache:', deleteError);
      }
    } catch (clearError) {
      console.error('Failed to clear old cache:', clearError);
    }
    
    // Store odds in database
    if (allGames.length > 0) {
      try {
        console.log('Inserting games into database...');
        const { error } = await supabase
          .from('odds_cache')
          .upsert(allGames, { 
            onConflict: 'external_game_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error('Database error:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Database error: ' + error.message,
              games_processed: 0 
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        } else {
          console.log('Successfully updated odds cache');
        }
      } catch (dbError) {
        console.error('Failed to update database:', dbError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Database connection error: ' + dbError,
            games_processed: 0 
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        games_processed: allGames.length,
        api_success: apiSuccess,
        rate_limit: apiRateLimit,
        message: apiSuccess ? 'Live NFL odds fetched successfully' : 'Using fallback NFL games (API unavailable)' 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
    
  } catch (error: any) {
    console.error('Error in fetch-odds function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        games_processed: 0 
      }),
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
  
  // Look through all bookmakers to find the best odds
  for (const bookmaker of game.bookmakers) {
    // Prefer DraftKings if available, otherwise use any bookmaker
    const isPreferred = bookmaker.key === 'draftkings';
    
    for (const market of bookmaker.markets) {
      if (market.key === 'h2h') {
        // Moneyline odds
        for (const outcome of market.outcomes) {
          if (outcome.name === game.home_team && (bestOdds.moneyline.home === null || isPreferred)) {
            bestOdds.moneyline.home = outcome.price;
          } else if (outcome.name === game.away_team && (bestOdds.moneyline.away === null || isPreferred)) {
            bestOdds.moneyline.away = outcome.price;
          }
        }
      } else if (market.key === 'spreads') {
        // Spread odds
        for (const outcome of market.outcomes) {
          if (outcome.name === game.home_team && (bestOdds.spread.home_line === null || isPreferred)) {
            bestOdds.spread.home_line = outcome.point;
            bestOdds.spread.home_odds = outcome.price;
          } else if (outcome.name === game.away_team && (bestOdds.spread.away_line === null || isPreferred)) {
            bestOdds.spread.away_line = outcome.point;
            bestOdds.spread.away_odds = outcome.price;
          }
        }
      } else if (market.key === 'totals') {
        // Total odds
        for (const outcome of market.outcomes) {
          if (outcome.name === 'Over' && (bestOdds.total.over_line === null || isPreferred)) {
            bestOdds.total.over_line = outcome.point;
            bestOdds.total.over_odds = outcome.price;
          } else if (outcome.name === 'Under' && (bestOdds.total.under_line === null || isPreferred)) {
            bestOdds.total.under_line = outcome.point;
            bestOdds.total.under_odds = outcome.price;
          }
        }
      }
    }
  }
  
  return bestOdds;
}

function extractPlayerProps(gameData: any) {
  const playerProps: any = {};
  
  if (!gameData?.bookmakers) return playerProps;
  
  // Organize props by category for better UI display
  const propCategories: { [key: string]: string } = {
    'player_pass_yds': 'Passing',
    'player_pass_tds': 'Passing',
    'player_pass_completions': 'Passing',
    'player_pass_attempts': 'Passing',
    'player_pass_interceptions': 'Passing',
    'player_rush_yds': 'Rushing',
    'player_rush_tds': 'Rushing',
    'player_rush_attempts': 'Rushing',
    'player_receptions': 'Receiving',
    'player_reception_yds': 'Receiving',
    'player_reception_tds': 'Receiving',
    'player_anytime_td': 'Touchdowns',
    'player_1st_td': 'Touchdowns',
    'player_sacks': 'Defense',
    'player_tackles_assists': 'Defense',
    'player_field_goals': 'Kicking',
    'player_kicking_points': 'Kicking',
    'player_pass_rush_reception_yds': 'Combined',
    'player_rush_reception_yds': 'Combined'
  };
  
  // Process each bookmaker (prefer DraftKings)
  for (const bookmaker of gameData.bookmakers) {
    const isPreferred = bookmaker.key === 'draftkings';
    
    for (const market of bookmaker.markets) {
      const category = propCategories[market.key];
      if (!category) continue;
      
      if (!playerProps[category]) playerProps[category] = {};
      if (!playerProps[category][market.key]) playerProps[category][market.key] = {};
      
      // Extract player-specific props
      for (const outcome of market.outcomes) {
        const playerName = outcome.name;
        
        if (!playerProps[category][market.key][playerName] || isPreferred) {
          playerProps[category][market.key][playerName] = {
            player_name: playerName,
            market_key: market.key,
            category: category,
            point: outcome.point || null,
            price: outcome.price,
            bookmaker: bookmaker.key,
            description: outcome.description || outcome.name
          };
        }
      }
    }
  }
  
  return playerProps;
}

serve(handler);

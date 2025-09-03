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

// No fallback data - only live API data

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting optimized NFL odds fetch for current season...');
    
    const oddsApiKey = Deno.env.get('ODDS_API_KEY');
    console.log('API Key available:', !!oddsApiKey);
    console.log('API Key length:', oddsApiKey ? oddsApiKey.length : 0);
    
    if (!oddsApiKey) {
      console.log('CRITICAL: No ODDS_API_KEY found in environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuration Error', 
          message: 'ODDS_API_KEY not configured. Please add your API key from theoddsapi.com',
          games_processed: 0 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    // Define sport keys for current NFL season (playoffs/regular season)
    const sportKeys = ['americanfootball_nfl'];  // Focus on main NFL season, skip preseason in January
    
    let allGames: any[] = [];
    let apiSuccess = false;
    let apiRateLimit = { requests_remaining: null, requests_used: null };
    
    try {
      console.log('Starting concurrent API calls for next 14 days...');
      
      // Calculate date range for current/upcoming games (14 days)
      const today = new Date();
      const twoWeeksFromNow = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
      // Remove milliseconds from ISO string to match API format requirement
      const commenceTimeFrom = today.toISOString().split('.')[0] + 'Z';
      const commenceTimeTo = twoWeeksFromNow.toISOString().split('.')[0] + 'Z';
      
      console.log(`Fetching games from ${commenceTimeFrom} to ${commenceTimeTo}...`);
      
      const basicMarkets = 'h2h,spreads,totals';
      
      // Player prop markets available in The Odds API - using correct market keys
      const playerPropMarkets = [
        'player_pass_yds',
        'player_pass_tds', 
        'player_pass_completions',
        'player_pass_attempts',
        'player_pass_interceptions',
        'player_rush_yds',
        'player_rush_attempts',
        'player_rush_tds',
        'player_receptions',
        'player_reception_yds',
        'player_reception_tds',
        'player_anytime_td',
        'player_1st_td',         // Fixed: was 'player_first_td'
        'player_last_td'
      ];
      
      // Fetch basic game data
      const nflResponse = await fetch(
        `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${oddsApiKey}&regions=us&markets=${basicMarkets}&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}`
      );

      // Extract rate limit info from response
      const remainingRequests = nflResponse.headers.get('x-requests-remaining');
      const usedRequests = nflResponse.headers.get('x-requests-used');
      if (remainingRequests) apiRateLimit.requests_remaining = parseInt(remainingRequests);
      if (usedRequests) apiRateLimit.requests_used = parseInt(usedRequests);

      // Check responses with enhanced error handling
      if (!nflResponse.ok) {
        const errorText = await nflResponse.text();
        console.error(`NFL API Error ${nflResponse.status}:`, errorText);
        
        // Enhanced error messages for common issues with proper JSON responses
        if (nflResponse.status === 401) {
          try {
            const errorObj = JSON.parse(errorText || '{}');
            if (errorObj?.error_code === 'MISSING_KEY') {
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  error: 'API Authentication Failed', 
                  message: 'Invalid or missing ODDS_API_KEY. Please check your API key configuration.',
                  games_processed: 0 
                }),
                {
                  status: 200,
                  headers: { 'Content-Type': 'application/json', ...corsHeaders },
                }
              );
            } else if (errorObj?.error_code === 'QUOTA_EXCEEDED') {
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  error: 'API Quota Exceeded', 
                  message: 'You have reached your API request limit. Please upgrade your plan or wait for quota reset.',
                  games_processed: 0 
                }),
                {
                  status: 200,
                  headers: { 'Content-Type': 'application/json', ...corsHeaders },
                }
              );
            }
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'API Authentication Failed', 
              message: 'Authentication failed. Please verify your ODDS_API_KEY.',
              games_processed: 0 
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }
        
        if (nflResponse.status === 404) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'No Upcoming Games', 
              message: 'No NFL games found in the next 14 days.',
              games_processed: 0 
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'API Service Error', 
            message: `NFL API request failed: ${nflResponse.status} - ${errorText}`,
            games_processed: 0 
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      const nflGames = await nflResponse.json();

      console.log(`Fetched ${nflGames.length} NFL games in next 14 days`);
      
      // Fetch player props for each game
      console.log('Fetching player props for games...');
      let playerPropsSuccess = false;
      let totalPlayerProps = 0;
      
      const processedGames = await Promise.all(nflGames.map(async (game: any) => {
        const bestOdds = extractBestOdds(game);
        let gamePlayerProps = {};
        
        try {
          // Fetch player props for this specific game
          const playerPropMarketsString = playerPropMarkets.join(',');
          const propsUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events/${game.id}/odds/?apiKey=${oddsApiKey}&regions=us&markets=${playerPropMarketsString}&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm`;
          
          console.log(`Fetching props for ${game.home_team} vs ${game.away_team}...`);
          
          const propsResponse = await fetch(propsUrl);
          
          if (propsResponse.ok) {
            const propsData = await propsResponse.json();
            if (propsData && propsData.bookmakers && propsData.bookmakers.length > 0) {
              gamePlayerProps = extractPlayerProps(propsData);
              const propsCount = Object.values(gamePlayerProps).reduce((total: number, category: any) => {
                return total + Object.values(category).reduce((catTotal: number, market: any) => {
                  return catTotal + Object.keys(market).length;
                }, 0);
              }, 0);
              
              if (propsCount > 0) {
                totalPlayerProps += propsCount;
                playerPropsSuccess = true;
                console.log(`  ✅ Found ${propsCount} player props for this game`);
              } else {
                console.log(`  ⚠️ No player props found for this game`);
              }
            } else {
              console.log(`  ⚠️ Empty response for player props for this game`);
            }
          } else {
            const errorText = await propsResponse.text();
            console.log(`  ❌ Player props API error (${propsResponse.status}): ${errorText}`);
          }
        } catch (propsError) {
          console.error(`  ❌ Error fetching player props for game ${game.id}:`, propsError);
        }
        
        return {
          external_game_id: game.id,
          sport: 'American Football',
          league: 'AMERICANFOOTBALL NFL',
          game_date: game.commence_time,
          team_a: game.home_team,
          team_b: game.away_team,
          ...bestOdds,
          player_props: gamePlayerProps,
          updated_at: new Date().toISOString(),
        };
      }));
      
      allGames = processedGames;
      
      console.log(`\n📊 PROCESSED GAMES SUMMARY:`);
      console.log(`Total games processed: ${allGames.length}`);
      console.log(`Total player props found: ${totalPlayerProps}`);
      console.log(`Player props success: ${playerPropsSuccess}`);
      console.log(`Live data only - no fallback data used`);
      
      // Return error if no live games are available
      if (allGames.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No Live Data Available', 
            message: 'No NFL games found in the next 14 days. Live data only - no fallback data used.',
            games_processed: 0,
            api_rate_limit: apiRateLimit,
            api_success: false
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      // Clear stale odds cache (older than 2 hours)
      try {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const { error: clearStaleError } = await supabase
          .from('odds_cache')
          .delete()
          .lt('updated_at', twoHoursAgo);
          
        if (clearStaleError) {
          console.error('Error clearing stale odds:', clearStaleError);
        } else {
          console.log('Cleared stale odds (older than 2 hours)');
        }
      } catch (clearError) {
        console.error('Error in stale odds cleanup:', clearError);
      }
      
      // Clear existing cache and insert fresh data
      const { error: clearAllError } = await supabase
        .from('odds_cache')
        .delete()
        .gt('updated_at', '1900-01-01T00:00:00Z');
      
      if (clearAllError) {
        console.error('Error clearing odds cache:', clearAllError);
      } else {
        console.log('Cleared existing odds cache');
      }

      // Insert fresh games
      const { error: insertError } = await supabase
        .from('odds_cache')
        .insert(allGames);

      if (insertError) {
        console.error('Error inserting games:', insertError);
        throw new Error('Failed to update odds cache');
      }

      console.log(`Successfully processed ${allGames.length} games`);
      console.log(`Rate limit info: ${apiRateLimit.requests_remaining || 'N/A'} remaining, ${apiRateLimit.requests_used || 'N/A'} used`);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Successfully fetched and cached ${allGames.length} live NFL games with player props`,
        games_processed: allGames.length,
        player_props_found: totalPlayerProps,
        api_rate_limit: apiRateLimit,
        api_success: true,
        player_props_available: playerPropsSuccess
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
      
    } catch (apiError: any) {
      console.error('API Error:', apiError);
      
      // No fallback - live data only
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API Service Unavailable', 
          message: 'Live NFL data is currently unavailable. No fallback data used - accuracy over availability.',
          games_processed: 0,
          api_rate_limit: { requests_remaining: null, requests_used: null },
          api_success: false
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

  } catch (error: any) {
    console.error('Critical error in fetch-odds function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        games_processed: 0
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function extractBestOdds(game: any): any {
  const result: any = {
    moneyline_home: null,
    moneyline_away: null,
    spread_home: null,
    spread_home_odds: null,
    spread_away: null,
    spread_away_odds: null,
    total_over: null,
    total_over_odds: null,
    total_under: null,
    total_under_odds: null
  };

  if (!game.bookmakers || game.bookmakers.length === 0) {
    return result;
  }

  // Prioritize DraftKings, then any available bookmaker
  const draftkings = game.bookmakers.find(b => b.key === 'draftkings');
  const fallbackBookmaker = game.bookmakers[0];
  
  const bookmaker = draftkings || fallbackBookmaker;

  bookmaker.markets?.forEach(market => {
    switch (market.key) {
      case 'h2h': // Moneyline
        market.outcomes?.forEach(outcome => {
          if (outcome.name === game.home_team) {
            result.moneyline_home = outcome.price;
          } else if (outcome.name === game.away_team) {
            result.moneyline_away = outcome.price;
          }
        });
        break;
        
      case 'spreads':
        market.outcomes?.forEach(outcome => {
          if (outcome.name === game.home_team) {
            result.spread_home = outcome.point;
            result.spread_home_odds = outcome.price;
          } else if (outcome.name === game.away_team) {
            result.spread_away = outcome.point;
            result.spread_away_odds = outcome.price;
          }
        });
        break;
        
      case 'totals':
        market.outcomes?.forEach(outcome => {
          if (outcome.name === 'Over') {
            result.total_over = outcome.point;
            result.total_over_odds = outcome.price;
          } else if (outcome.name === 'Under') {
            result.total_under = outcome.point;
            result.total_under_odds = outcome.price;
          }
        });
        break;
    }
  });

  return result;
}

function extractPlayerProps(game: any): any {
  const playerProps: any = {};
  
  if (!game || !game.bookmakers) {
    console.log('No game or bookmakers data for extractPlayerProps');
    return playerProps;
  }

  console.log(`Extracting props from ${game.bookmakers.length} bookmakers`);
  
  game.bookmakers.forEach((bookmaker: any, bookIdx: number) => {
    console.log(`  Bookmaker ${bookIdx + 1}: ${bookmaker.title || bookmaker.key}`);
    
    if (!bookmaker.markets) {
      console.log(`    No markets for bookmaker ${bookmaker.title || bookmaker.key}`);
      return;
    }
    
    console.log(`    Processing ${bookmaker.markets.length} markets`);
    
    bookmaker.markets.forEach((market: any, marketIdx: number) => {
      console.log(`    Market ${marketIdx + 1}: ${market.key} (${market.outcomes?.length || 0} outcomes)`);
      
      if (!market.outcomes) return;
      
      // Extract player name from the market description or first outcome's description
      let currentPlayer = '';
      
      market.outcomes.forEach((outcome: any, outcomeIdx: number) => {
        const betType = outcome.name; // This is "Over", "Under", or "Yes"
        const marketKey = market.key;
        
        // Enhanced logging to understand actual API response structure
        console.log(`      Outcome ${outcomeIdx + 1}: ${betType} - Point: ${outcome.point}, Price: ${outcome.price}`);
        console.log(`        Full outcome object:`, JSON.stringify(outcome, null, 2));
        
        // Try to extract player name from description field
        let playerName = '';
        if (outcome.description) {
          console.log(`        Description: ${outcome.description}`);
          playerName = outcome.description;
        } else if (outcome.participant_name) {
          playerName = outcome.participant_name;
        } else if (outcome.player_name) {
          playerName = outcome.player_name;
        } else {
          // If no player info in outcome, try to extract from market name or use a placeholder
          playerName = `Player_${outcomeIdx + 1}`;
        }
        
        // Clean up player name if it contains extra information
        if (playerName && typeof playerName === 'string') {
          // Remove common suffixes that might be in the description
          playerName = playerName.replace(/\s+(Over|Under|Yes|No)\s*$/gi, '').trim();
        }
        
        if (!playerName) {
          console.log(`        Warning: No player name found for outcome ${outcomeIdx + 1}`);
          return;
        }
        
        console.log(`        Extracted player name: "${playerName}"`);
        
        // Determine category based on market key
        let category = 'Other';
        if (marketKey.includes('pass')) category = 'Passing';
        else if (marketKey.includes('rush')) category = 'Rushing';
        else if (marketKey.includes('reception') || marketKey.includes('receiving')) category = 'Receiving';
        else if (marketKey.includes('td') || marketKey.includes('touchdown')) category = 'Touchdowns';
        else if (marketKey.includes('sack') || marketKey.includes('tackle')) category = 'Defense';
        else if (marketKey.includes('field_goal') || marketKey.includes('kicking')) category = 'Kicking';
        
        // Initialize category if it doesn't exist
        if (!playerProps[category]) {
          playerProps[category] = {};
          console.log(`        Created category: ${category}`);
        }
        
        // Initialize market if it doesn't exist
        if (!playerProps[category][marketKey]) {
          playerProps[category][marketKey] = {};
          console.log(`        Created market: ${marketKey} in ${category}`);
        }
        
        // Initialize player if it doesn't exist
        if (!playerProps[category][marketKey][playerName]) {
          playerProps[category][marketKey][playerName] = {
            player_name: playerName,
            market_key: marketKey,
            category: category,
            bookmaker: bookmaker.title || bookmaker.key,
            over_price: null,
            under_price: null,
            point: null,
            yes_price: null
          };
        }
        
        // Store the outcome based on bet type
        const playerData = playerProps[category][marketKey][playerName];
        
        if (betType === 'Over') {
          playerData.over_price = outcome.price;
          playerData.point = outcome.point;
          console.log(`        Stored Over prop for ${playerName}: ${marketKey} ${outcome.point || ''} at ${outcome.price}`);
        } else if (betType === 'Under') {
          playerData.under_price = outcome.price;
          if (!playerData.point) playerData.point = outcome.point;
          console.log(`        Stored Under prop for ${playerName}: ${marketKey} ${outcome.point || ''} at ${outcome.price}`);
        } else if (betType === 'Yes') {
          playerData.yes_price = outcome.price;
          console.log(`        Stored Yes prop for ${playerName}: ${marketKey} at ${outcome.price}`);
        } else {
          // For other bet types, store as generic price
          playerData.price = outcome.price;
          if (outcome.point) playerData.point = outcome.point;
          console.log(`        Stored ${betType} prop for ${playerName}: ${marketKey} at ${outcome.price}`);
        }
      });
    });
  });

  const totalCategories = Object.keys(playerProps).length;
  let totalMarkets = 0;
  let totalPlayers = 0;
  
  Object.values(playerProps).forEach((category: any) => {
    const markets = Object.keys(category).length;
    totalMarkets += markets;
    Object.values(category).forEach((market: any) => {
      totalPlayers += Object.keys(market).length;
    });
  });
  
  console.log(`✅ Extracted player props summary:`);
  console.log(`  Categories: ${totalCategories}`);
  console.log(`  Markets: ${totalMarkets}`);
  console.log(`  Total player props: ${totalPlayers}`);

  return playerProps;
}

serve(handler);

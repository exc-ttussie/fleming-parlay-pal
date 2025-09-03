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

// Fallback games array
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
      // Comprehensive player props
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
    game_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
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
  },
  {
    external_game_id: 'test-dolphins-game',
    sport: 'American Football',
    league: 'AMERICANFOOTBALL NFL',
    game_date: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    team_a: 'Miami Dolphins',
    team_b: 'New York Jets',
    moneyline_home: -125,
    moneyline_away: 105,
    spread_home: -2.5,
    spread_home_odds: -110,
    spread_away: 2.5,
    spread_away_odds: -110,
    total_over: 44.5,
    total_over_odds: -110,
    total_under: 44.5,
    total_under_odds: -110,
    player_props: {
      'Passing': {
        'player_pass_yds': {
          'Tua Tagovailoa': { player_name: 'Tua Tagovailoa', market_key: 'player_pass_yds', category: 'Passing', point: 247.5, price: -115, bookmaker: 'draftkings' },
          'Aaron Rodgers': { player_name: 'Aaron Rodgers', market_key: 'player_pass_yds', category: 'Passing', point: 265.5, price: -110, bookmaker: 'draftkings' }
        },
        'player_pass_tds': {
          'Tua Tagovailoa': { player_name: 'Tua Tagovailoa', market_key: 'player_pass_tds', category: 'Passing', point: 1.5, price: -120, bookmaker: 'draftkings' },
          'Aaron Rodgers': { player_name: 'Aaron Rodgers', market_key: 'player_pass_tds', category: 'Passing', point: 1.5, price: -105, bookmaker: 'draftkings' }
        },
        'player_pass_completions': {
          'Tua Tagovailoa': { player_name: 'Tua Tagovailoa', market_key: 'player_pass_completions', category: 'Passing', point: 22.5, price: -110, bookmaker: 'draftkings' },
          'Aaron Rodgers': { player_name: 'Aaron Rodgers', market_key: 'player_pass_completions', category: 'Passing', point: 20.5, price: -115, bookmaker: 'draftkings' }
        }
      },
      'Rushing': {
        'player_rush_yds': {
          'De\'Von Achane': { player_name: 'De\'Von Achane', market_key: 'player_rush_yds', category: 'Rushing', point: 78.5, price: -110, bookmaker: 'draftkings' },
          'Breece Hall': { player_name: 'Breece Hall', market_key: 'player_rush_yds', category: 'Rushing', point: 65.5, price: -115, bookmaker: 'draftkings' }
        },
        'player_rush_tds': {
          'De\'Von Achane': { player_name: 'De\'Von Achane', market_key: 'player_rush_tds', category: 'Rushing', point: 0.5, price: 115, bookmaker: 'draftkings' },
          'Breece Hall': { player_name: 'Breece Hall', market_key: 'player_rush_tds', category: 'Rushing', point: 0.5, price: 105, bookmaker: 'draftkings' }
        }
      },
      'Receiving': {
        'player_reception_yds': {
          'Tyreek Hill': { player_name: 'Tyreek Hill', market_key: 'player_reception_yds', category: 'Receiving', point: 85.5, price: -115, bookmaker: 'draftkings' },
          'Jaylen Waddle': { player_name: 'Jaylen Waddle', market_key: 'player_reception_yds', category: 'Receiving', point: 62.5, price: -110, bookmaker: 'draftkings' },
          'Garrett Wilson': { player_name: 'Garrett Wilson', market_key: 'player_reception_yds', category: 'Receiving', point: 68.5, price: -105, bookmaker: 'draftkings' }
        },
        'player_receptions': {
          'Tyreek Hill': { player_name: 'Tyreek Hill', market_key: 'player_receptions', category: 'Receiving', point: 6.5, price: -120, bookmaker: 'draftkings' },
          'Jaylen Waddle': { player_name: 'Jaylen Waddle', market_key: 'player_receptions', category: 'Receiving', point: 5.5, price: -110, bookmaker: 'draftkings' }
        }
      },
      'Touchdowns': {
        'player_anytime_td': {
          'Tyreek Hill': { player_name: 'Tyreek Hill', market_key: 'player_anytime_td', category: 'Touchdowns', point: null, price: 140, bookmaker: 'draftkings' },
          'De\'Von Achane': { player_name: 'De\'Von Achane', market_key: 'player_anytime_td', category: 'Touchdowns', point: null, price: 130, bookmaker: 'draftkings' },
          'Garrett Wilson': { player_name: 'Garrett Wilson', market_key: 'player_anytime_td', category: 'Touchdowns', point: null, price: 155, bookmaker: 'draftkings' }
        }
      }
    },
    updated_at: new Date().toISOString(),
  }
];

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
      const playerPropMarkets = [
        'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts',
        'player_pass_interceptions', 'player_rush_yds', 'player_rush_tds', 'player_rush_attempts',
        'player_receptions', 'player_reception_yds', 'player_reception_tds', 'player_anytime_td',
        'player_1st_td', 'player_sacks', 'player_tackles_assists', 'player_field_goals',
        'player_kicking_points', 'player_pass_rush_reception_yds', 'player_rush_reception_yds'
      ].join(',');
      
      // Fetch all data concurrently for current NFL season only
      const [nflResponse, nflPlayerPropsResponse] = await Promise.all([
        // Regular season/playoff games (next 14 days)
        fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${oddsApiKey}&regions=us&markets=${basicMarkets}&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}`),
        
        // NFL player props (bulk fetch - huge performance gain)
        fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${oddsApiKey}&regions=us&markets=${playerPropMarkets}&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars,betonlineag&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}`)
      ]);

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

      const [nflGames, nflPlayerProps] = await Promise.all([
        nflResponse.json(),
        nflPlayerPropsResponse.ok ? nflPlayerPropsResponse.json() : []
      ]);

      console.log(`Fetched ${nflGames.length} NFL games in next 14 days`);
      console.log(`Fetched player props for ${nflPlayerProps.length} games`);
      
      // Process games and extract best odds
      // const allGames = nflGames.map(game => {
      //   const bestOdds = extractBestOdds(game);
      //   return {
      //     external_game_id: game.id,
      //     sport: 'American Football',
      //     league: 'AMERICANFOOTBALL NFL',
      //     game_date: game.commence_time,
      //     team_a: game.home_team,
      //     team_b: game.away_team,
      //     ...bestOdds,
      //     updated_at: new Date().toISOString(),
      //   };
      // });
      
      // Function to process each game and extract player props
      // const processGame = async (game: any) => {
      //   const bestOdds = extractBestOdds(game);
      //   let playerProps = {};
        
      //   // Fetch player props only if the game has bookmakers
      //   if (game.bookmakers && game.bookmakers.length > 0) {
      //     try {
      //       // Fetch player props for the specific game
      //       const playerPropsResponse = await fetch(
      //         `https://api.the-odds-api.com/v4/sports/${game.sport_key}/odds/?apiKey=${oddsApiKey}&regions=us&markets=player_pass_yds,player_pass_tds,player_rush_yds,player_rush_tds,player_reception_yds,player_receptions,player_anytime_td&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars`,
      //         {
      //           headers: {
      //             'Content-Type': 'application/json',
      //           },
      //         }
      //       );
            
      //       if (!playerPropsResponse.ok) {
      //         console.error(`Player Props API Error ${playerPropsResponse.status}:`, await playerPropsResponse.text());
      //       } else {
      //         const playerPropsData = await playerPropsResponse.json();
      //         playerProps = extractPlayerProps(playerPropsData[0]); // Assuming only one game is returned
      //       }
      //     } catch (playerPropsError) {
      //       console.error('Error fetching player props:', playerPropsError);
      //     }
      //   } else {
      //     console.log(`No bookmakers available for game ${game.id}, skipping player props`);
      //   }
        
      //   // Create proper league name format
      //   let leagueName = 'AMERICANFOOTBALL NFL';
        
      //   return {
      //     external_game_id: game.id,
      //     sport: 'American Football',
      //     league: leagueName,
      //     game_date: game.commence_time,
      //     team_a: game.home_team,
      //     team_b: game.away_team,
      //     ...bestOdds,
      //     player_props: playerProps,
      //     updated_at: new Date().toISOString(),
      //   };
      // };

      // Create a map of game ID to player props for fast O(1) lookup
      const playerPropsMap = new Map();
      nflPlayerProps.forEach(game => {
        if (game.bookmakers && game.bookmakers.length > 0) {
          const props = extractPlayerProps(game);
          playerPropsMap.set(game.id, props);
        }
      });

      // Process all games concurrently
      allGames = await Promise.all(
        nflGames.map(async (game) => {
          const bestOdds = extractBestOdds(game);
          
          // Create proper league name format
          let leagueName = 'AMERICANFOOTBALL NFL';
          
          // Get player props from map (O(1) lookup vs N API calls)
          const playerProps = playerPropsMap.get(game.id) || {};

          return {
            external_game_id: game.id,
            sport: 'American Football',
            league: leagueName,
            game_date: game.commence_time,
            team_a: game.home_team,
            team_b: game.away_team,
            ...bestOdds,
            player_props: playerProps,
            updated_at: new Date().toISOString(),
          };
        })
      );

      // Clear stale data and insert new data
      if (allGames.length > 0) {
        const { error: deleteError } = await supabase
          .from('odds_cache')
          .delete()
          .neq('id', 'never-match-this');

        if (deleteError) {
          console.error('Error clearing stale odds:', deleteError);
        }

        const { error: insertError } = await supabase
          .from('odds_cache')
          .insert(allGames);

        if (insertError) {
          console.error('Error inserting games:', insertError);
          throw new Error('Failed to update odds cache');
        }
      }

      console.log(`Successfully processed ${allGames.length} games`);
      console.log(`Rate limit info: ${apiRateLimit.requests_remaining || 'N/A'} remaining, ${apiRateLimit.requests_used || 'N/A'} used`);
      
      apiSuccess = true; // Set success flag after successful processing
      
      const result = {
        success: allGames.length > 0,
        message: allGames.length > 0 ? `Successfully fetched and cached ${allGames.length} games with odds` : 'No current games found',
        games_processed: allGames.length,
        api_rate_limit: apiRateLimit,
        api_success: apiSuccess
      };
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (apiError: any) {
      console.error('API Error:', apiError);
      
      // Enhanced fallback with test data
      console.log('Falling back to comprehensive test data with player props...');
      
      // Clear any stale data
      await supabase
        .from('odds_cache')
        .delete()
        .neq('id', 'never-match-this');
      
      // Insert fallback games with comprehensive props
      const { error: insertError } = await supabase
        .from('odds_cache')
        .insert(fallbackGames);
      
      if (insertError) {
        console.error('Error inserting fallback games:', insertError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Database Error',
            message: 'Failed to insert fallback data',
            games_processed: 0,
            api_success: false
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      
      console.log(`Successfully inserted ${fallbackGames.length} fallback games with comprehensive player props`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `API unavailable - using ${fallbackGames.length} test games with comprehensive player props including Tua Tagovailoa`,
          games_processed: fallbackGames.length,
          api_rate_limit: { requests_remaining: null, requests_used: null },
          api_success: false,
          fallback_used: true
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
  
  if (!game.bookmakers || game.bookmakers.length === 0) {
    return playerProps;
  }

  // Prioritize DraftKings for props
  const draftkings = game.bookmakers.find(b => b.key === 'draftkings');
  const bookmaker = draftkings || game.bookmakers[0];

  bookmaker.markets?.forEach(market => {
    if (market.key.startsWith('player_')) {
      // Categorize props
      let category = 'Other';
      if (market.key.includes('pass')) category = 'Passing';
      else if (market.key.includes('rush')) category = 'Rushing';
      else if (market.key.includes('reception') || market.key.includes('receptions')) category = 'Receiving';
      else if (market.key.includes('td')) category = 'Touchdowns';

      if (!playerProps[category]) {
        playerProps[category] = {};
      }
      
      if (!playerProps[category][market.key]) {
        playerProps[category][market.key] = {};
      }

      market.outcomes?.forEach(outcome => {
        playerProps[category][market.key][outcome.name] = {
          player_name: outcome.name,
          market_key: market.key,
          category: category,
          point: outcome.point || null,
          price: outcome.price,
          bookmaker: bookmaker.key
        };
      });
    }
  });

  return playerProps;
}

serve(handler);

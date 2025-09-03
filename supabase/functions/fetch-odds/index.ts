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
  },
  {
    external_game_id: 'test-dolphins-game',
    sport: 'American Football',
    league: 'AMERICANFOOTBALL NFL',
    game_date: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(), // 36 hours from now
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting optimized NFL odds fetch...');
    console.log('API Key available:', !!oddsApiKey);
    
    const basicMarkets = 'h2h,spreads,totals';
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
    
    try {
      console.log('Starting concurrent API calls...');
      
      // Fetch all data concurrently - major performance improvement
      const [nflResponse, preseasonResponse, nflPlayerPropsResponse, preseasonPlayerPropsResponse] = await Promise.all([
        // Regular season games
        fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${oddsApiKey}&regions=us&markets=${basicMarkets}&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars`),
        
        // Preseason games  
        fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl_preseason/odds/?apiKey=${oddsApiKey}&regions=us&markets=${basicMarkets}&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars`),
        
        // NFL player props (bulk fetch - huge performance gain)
        fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${oddsApiKey}&regions=us&markets=${playerPropMarkets}&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars,betonlineag`),
        
        // NFL Preseason player props (bulk fetch)
        fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl_preseason/odds/?apiKey=${oddsApiKey}&regions=us&markets=${playerPropMarkets}&oddsFormat=american&bookmakers=draftkings,fanduel,betmgm,caesars,betonlineag`)
      ]);

      // Extract rate limit info from first response
      const remainingRequests = nflResponse.headers.get('x-requests-remaining');
      const usedRequests = nflResponse.headers.get('x-requests-used');
      if (remainingRequests) apiRateLimit.requests_remaining = parseInt(remainingRequests);
      if (usedRequests) apiRateLimit.requests_used = parseInt(usedRequests);

      // Check responses and parse data concurrently
      if (!nflResponse.ok) {
        throw new Error(`NFL API request failed: ${nflResponse.status}`);
      }
      if (!preseasonResponse.ok) {
        throw new Error(`Preseason API request failed: ${preseasonResponse.status}`);
      }

      const [nflGames, preseasonGames, nflPlayerProps, preseasonPlayerProps] = await Promise.all([
        nflResponse.json(),
        preseasonResponse.json(),
        nflPlayerPropsResponse.ok ? nflPlayerPropsResponse.json() : [],
        preseasonPlayerPropsResponse.ok ? preseasonPlayerPropsResponse.json() : []
      ]);

      console.log(`Fetched ${nflGames.length} NFL games and ${preseasonGames.length} preseason games`);
      console.log(`Fetched player props for ${nflPlayerProps.length + preseasonPlayerProps.length} games`);
      
      // ENHANCED DEBUGGING: Log detailed API response analysis
      let propsCount = 0;
      let gamesWithProps = 0;
      let gamesWithin48Hours = 0;
      let gamesWithPropsWithin48Hours = 0;
      
      // Debug function to analyze each game's prop availability
      const analyzeGameProps = (games: any[], gameType: string) => {
        games.forEach((game, index) => {
          const gameTime = new Date(game.commence_time);
          const hoursUntilGame = (gameTime.getTime() - Date.now()) / (1000 * 60 * 60);
          const isWithin48Hours = hoursUntilGame <= 48;
          
          if (isWithin48Hours) gamesWithin48Hours++;
          
          console.log(`\n=== ${gameType.toUpperCase()} GAME ${index + 1}: ${game.home_team} vs ${game.away_team} ===`);
          console.log(`Game ID: ${game.id}`);
          console.log(`Kickoff: ${game.commence_time} (${Math.round(hoursUntilGame)}h from now)`);
          console.log(`Within 48h: ${isWithin48Hours ? 'YES' : 'NO'}`);
          
          if (game.bookmakers && game.bookmakers.length > 0) {
            console.log(`Bookmakers available: ${game.bookmakers.length}`);
            
            game.bookmakers.forEach((bookmaker: any, bmIndex: number) => {
              console.log(`  Bookmaker ${bmIndex + 1}: ${bookmaker.title} (${bookmaker.key})`);
              
              if (bookmaker.markets && bookmaker.markets.length > 0) {
                console.log(`    Markets: ${bookmaker.markets.length}`);
                bookmaker.markets.forEach((market: any, mIndex: number) => {
                  console.log(`      Market ${mIndex + 1}: ${market.key} (${market.outcomes?.length || 0} outcomes)`);
                  
                  // Log sample outcomes for player prop markets
                  if (market.key.includes('player_') && market.outcomes) {
                    market.outcomes.slice(0, 2).forEach((outcome: any) => {
                      console.log(`        Sample: ${outcome.name} - ${outcome.point || 'N/A'} @ ${outcome.price}`);
                    });
                  }
                  propsCount++;
                });
                
                gamesWithProps++;
                if (isWithin48Hours) gamesWithPropsWithin48Hours++;
              } else {
                console.log(`    NO MARKETS for ${bookmaker.title}`);
              }
            });
          } else {
            console.log(`NO BOOKMAKERS for this game`);
          }
          
          // Special attention to Dolphins games
          if (game.home_team?.includes('Dolphins') || game.away_team?.includes('Dolphins')) {
            console.log(`🐬 DOLPHINS GAME DETECTED! ${game.home_team} vs ${game.away_team}`);
            console.log(`🐬 Hours until kickoff: ${Math.round(hoursUntilGame)}`);
            console.log(`🐬 Bookmakers: ${game.bookmakers?.length || 0}`);
            console.log(`🐬 Total markets: ${game.bookmakers?.reduce((sum: number, bm: any) => sum + (bm.markets?.length || 0), 0) || 0}`);
          }
        });
      };
      
      console.log('\n📊 ANALYZING NFL PLAYER PROPS API RESPONSE:');
      analyzeGameProps(nflPlayerProps, 'nfl');
      
      console.log('\n📊 ANALYZING NFL PRESEASON PLAYER PROPS API RESPONSE:');
      analyzeGameProps(preseasonPlayerProps, 'preseason');
      
      console.log(`\n🔢 SUMMARY STATS:`);
      console.log(`Total games analyzed: ${nflPlayerProps.length + preseasonPlayerProps.length}`);
      console.log(`Games within 48h: ${gamesWithin48Hours}`);
      console.log(`Games with any props: ${gamesWithProps}`);
      console.log(`Games with props within 48h: ${gamesWithPropsWithin48Hours}`);
      console.log(`Total prop markets found: ${propsCount}`);
      
      if (gamesWithProps === 0) {
        console.log('\n❌ CRITICAL: No player props found for ANY games!');
        console.log('This suggests an issue with:');
        console.log('1. API endpoint URLs');
        console.log('2. Market key parameters');
        console.log('3. Bookmaker availability'); 
        console.log('4. API response format changes');
      } else if (gamesWithPropsWithin48Hours === 0 && gamesWithin48Hours > 0) {
        console.log('\n⚠️  WARNING: Games within 48h exist but have no props - this is unusual');
      }
      
      apiSuccess = true;

      // Combine all games
      const allBasicGames = [...nflGames, ...preseasonGames];
      const allPlayerProps = [...nflPlayerProps, ...preseasonPlayerProps];

      // Create a map of game ID to player props for fast O(1) lookup
      const playerPropsMap = new Map();
      allPlayerProps.forEach(game => {
        if (game.bookmakers && game.bookmakers.length > 0) {
          const props = extractPlayerProps(game);
          playerPropsMap.set(game.id, props);
          console.log(`Extracted props for ${game.home_team} vs ${game.away_team}: ${Object.keys(props).length} categories`);
        } else {
          console.log(`No props available for ${game.home_team || 'Unknown'} vs ${game.away_team || 'Unknown'} (ID: ${game.id})`);
        }
      });

      // Process all games concurrently - another big performance gain
      allGames = await Promise.all(
        allBasicGames.map(async (game) => {
          const bestOdds = extractBestOdds(game);
          
          // Create proper league name format
          let leagueName = 'AMERICANFOOTBALL NFL';
          if (game.sport_key === 'americanfootball_nfl_preseason') {
            leagueName = 'AMERICANFOOTBALL NFL PRESEASON';
          }
          
          // Get player props from map (O(1) lookup vs N API calls)
          const playerProps = playerPropsMap.get(game.id) || {};
          const propsAvailable = Object.keys(playerProps).length > 0;
          
          // Calculate hours until game starts for props availability context
          const gameTime = new Date(game.commence_time);
          const hoursUntilGame = (gameTime.getTime() - Date.now()) / (1000 * 60 * 60);
          
          if (propsAvailable) {
            console.log(`✓ Props available for ${game.home_team} vs ${game.away_team} (${Math.round(hoursUntilGame)}h until kickoff)`);
          } else {
            console.log(`✗ No props for ${game.home_team} vs ${game.away_team} (${Math.round(hoursUntilGame)}h until kickoff) - ${hoursUntilGame > 48 ? 'likely too early' : 'check API'}`);
          }

          return {
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
          };
        })
      );

    } catch (error) {
      console.error('Error fetching from API:', error);
      apiSuccess = false;
      allGames = [...fallbackGames];
    }
    
    // If no games were fetched from API, use fallback data
    if (!apiSuccess || allGames.length === 0) {
      console.log('No games from API, using fallback data');
      allGames = [...fallbackGames];
    }
    
    console.log(`Total games processed: ${allGames.length}`);
    
    // Database operations - optimized with batching
    try {
      console.log('Updating database...');
      
      // Clear old cache and insert new data concurrently where possible
      const { error: deleteError } = await supabase
        .from('odds_cache')
        .delete()
        .lt('updated_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()); // Delete games older than 6 hours
      
      if (deleteError) {
        console.error('Error clearing old cache:', deleteError);
      }

      // Insert games in batches for better performance
      const batchSize = 20;
      const batches = [];
      for (let i = 0; i < allGames.length; i += batchSize) {
        batches.push(allGames.slice(i, i + batchSize));
      }

      console.log(`Inserting ${allGames.length} games in ${batches.length} batches...`);
      const insertResults = await Promise.all(
        batches.map((batch, index) => {
          console.log(`Inserting batch ${index + 1}/${batches.length} (${batch.length} games)`);
          return supabase.from('odds_cache').upsert(batch, { 
            onConflict: 'external_game_id',
            ignoreDuplicates: false 
          });
        })
      );

      const insertErrors = insertResults.filter(result => result.error);
      if (insertErrors.length > 0) {
        console.error('Error inserting some batches:', insertErrors);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to insert some odds data',
            games_processed: 0 
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      console.log('Successfully updated odds cache');
      
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

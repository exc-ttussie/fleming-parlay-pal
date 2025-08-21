-- Create odds_cache table to store live odds data
CREATE TABLE public.odds_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_game_id TEXT NOT NULL UNIQUE,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  game_date TIMESTAMP WITH TIME ZONE NOT NULL,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  moneyline_home INTEGER,
  moneyline_away INTEGER,
  spread_home NUMERIC,
  spread_home_odds INTEGER,
  spread_away NUMERIC,
  spread_away_odds INTEGER,
  total_over NUMERIC,
  total_over_odds INTEGER,
  total_under NUMERIC,
  total_under_odds INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.odds_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read odds
CREATE POLICY "Odds are viewable by authenticated users" 
ON public.odds_cache 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Create index for better performance
CREATE INDEX idx_odds_cache_game_date ON public.odds_cache(game_date);
CREATE INDEX idx_odds_cache_sport ON public.odds_cache(sport);
CREATE INDEX idx_odds_cache_league ON public.odds_cache(league);
-- Add player prop support to legs table
ALTER TABLE public.legs 
ADD COLUMN IF NOT EXISTS player_name TEXT,
ADD COLUMN IF NOT EXISTS prop_type TEXT,
ADD COLUMN IF NOT EXISTS prop_category TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_legs_player_name ON public.legs(player_name);
CREATE INDEX IF NOT EXISTS idx_legs_prop_type ON public.legs(prop_type);
CREATE INDEX IF NOT EXISTS idx_legs_prop_category ON public.legs(prop_category);

-- Add player prop support to odds_cache table
ALTER TABLE public.odds_cache 
ADD COLUMN IF NOT EXISTS player_props JSONB DEFAULT '{}';

-- Create index for player props JSON queries
CREATE INDEX IF NOT EXISTS idx_odds_cache_player_props ON public.odds_cache USING GIN(player_props);
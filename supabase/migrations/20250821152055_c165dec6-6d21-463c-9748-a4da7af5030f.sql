
-- Add a unique constraint so upsert(onConflict: 'external_game_id') works
ALTER TABLE public.odds_cache
ADD CONSTRAINT odds_cache_external_game_id_key UNIQUE (external_game_id);

-- Helpful indexes for fast reads in the modal
CREATE INDEX IF NOT EXISTS odds_cache_league_game_date_idx
  ON public.odds_cache (league, game_date);

CREATE INDEX IF NOT EXISTS odds_cache_updated_at_idx
  ON public.odds_cache (updated_at);

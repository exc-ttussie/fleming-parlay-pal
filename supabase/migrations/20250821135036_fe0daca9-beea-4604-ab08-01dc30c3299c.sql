-- Create enums for the application
CREATE TYPE public.app_role AS ENUM ('MEMBER', 'COMMISSIONER');
CREATE TYPE public.week_status AS ENUM ('OPEN', 'LOCKED', 'FINALIZED');
CREATE TYPE public.leg_status AS ENUM ('PENDING', 'OK', 'DUPLICATE', 'CONFLICT', 'REJECTED');

-- Create users table (profiles)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  team_name TEXT,
  role app_role DEFAULT 'MEMBER' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create seasons table
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL, -- e.g., "NFL 2025"
  league TEXT NOT NULL, -- "NFL"
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create weeks table
CREATE TABLE public.weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.seasons(id) NOT NULL,
  week_number INTEGER NOT NULL,
  status week_status DEFAULT 'OPEN' NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL,
  locks_at TIMESTAMPTZ NOT NULL, -- Sunday 13:00 ET
  finalized_at TIMESTAMPTZ,
  stake_amount INTEGER DEFAULT 13000 NOT NULL, -- in cents
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create legs table
CREATE TABLE public.legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES public.weeks(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sport_key TEXT NOT NULL, -- e.g., "americanfootball_nfl"
  league TEXT NOT NULL, -- e.g., "NFL"
  game_id TEXT, -- provider event id if available
  game_desc TEXT NOT NULL, -- e.g., "NE Patriots @ NY Jets 2025-09-14"
  market_key TEXT NOT NULL, -- e.g., "spreads", "totals", "h2h"
  selection TEXT NOT NULL, -- e.g., "Patriots -3.5"
  line DECIMAL,
  american_odds INTEGER NOT NULL, -- e.g., -110 or +145
  decimal_odds DECIMAL NOT NULL, -- computed decimal for math
  source TEXT NOT NULL, -- "api" or "manual"
  bookmaker TEXT NOT NULL, -- "draftkings"
  notes TEXT,
  status leg_status DEFAULT 'PENDING' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create parlay table
CREATE TABLE public.parlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES public.weeks(id) NOT NULL UNIQUE,
  combined_decimal DECIMAL NOT NULL,
  combined_american INTEGER NOT NULL,
  stake_amount INTEGER NOT NULL, -- in cents
  projected_payout INTEGER NOT NULL, -- in cents
  legs_count INTEGER NOT NULL,
  summary_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parlays ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: users can view all profiles but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seasons: viewable by all authenticated users
CREATE POLICY "Seasons are viewable by authenticated users" ON public.seasons
  FOR SELECT USING (auth.role() = 'authenticated');

-- Weeks: viewable by all authenticated users
CREATE POLICY "Weeks are viewable by authenticated users" ON public.weeks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Legs: users can view all legs, but only create/update their own
CREATE POLICY "Legs are viewable by authenticated users" ON public.legs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own legs" ON public.legs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own legs" ON public.legs
  FOR UPDATE USING (auth.uid() = user_id);

-- Parlays: viewable by all authenticated users
CREATE POLICY "Parlays are viewable by authenticated users" ON public.parlays
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_legs_week_market ON public.legs (week_id, market_key, selection);
CREATE INDEX idx_legs_user_week ON public.legs (user_id, week_id);
CREATE INDEX idx_weeks_season ON public.weeks (season_id);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weeks_updated_at
  BEFORE UPDATE ON public.weeks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legs_updated_at
  BEFORE UPDATE ON public.legs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parlays_updated_at
  BEFORE UPDATE ON public.parlays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.seasons (id, label, league, start_date, end_date) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'NFL 2024', 'NFL', '2024-09-05', '2025-02-15');

-- Seed initial week
INSERT INTO public.weeks (season_id, week_number, opens_at, locks_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 1, '2024-09-02 16:00:00+00', '2024-09-08 17:00:00+00');
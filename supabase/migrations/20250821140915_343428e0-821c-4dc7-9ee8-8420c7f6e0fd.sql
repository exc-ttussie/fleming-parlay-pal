-- Create tables for Fleming Parlay Coordinator
CREATE TABLE public.legs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  game_date TIMESTAMP WITH TIME ZONE NOT NULL,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('moneyline', 'spread', 'total')),
  selection TEXT NOT NULL,
  odds INTEGER NOT NULL,
  stake DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  external_game_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking parlay groups
CREATE TABLE public.parlays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_stake DECIMAL(10,2) NOT NULL DEFAULT 0,
  potential_payout DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'void')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for parlay legs
CREATE TABLE public.parlay_legs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parlay_id UUID NOT NULL REFERENCES public.parlays(id) ON DELETE CASCADE,
  leg_id UUID NOT NULL REFERENCES public.legs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parlay_id, leg_id)
);

-- Enable RLS on all tables
ALTER TABLE public.legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parlay_legs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for legs
CREATE POLICY "Users can view their own legs" 
ON public.legs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own legs" 
ON public.legs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own legs" 
ON public.legs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own legs" 
ON public.legs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for parlays
CREATE POLICY "Users can view their own parlays" 
ON public.parlays 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own parlays" 
ON public.parlays 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parlays" 
ON public.parlays 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own parlays" 
ON public.parlays 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for parlay_legs
CREATE POLICY "Users can view their own parlay legs" 
ON public.parlay_legs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.parlays 
  WHERE public.parlays.id = parlay_id 
  AND public.parlays.user_id = auth.uid()
));

CREATE POLICY "Users can create their own parlay legs" 
ON public.parlay_legs 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.parlays 
  WHERE public.parlays.id = parlay_id 
  AND public.parlays.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own parlay legs" 
ON public.parlay_legs 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.parlays 
  WHERE public.parlays.id = parlay_id 
  AND public.parlays.user_id = auth.uid()
));

-- Add triggers for timestamp updates
CREATE TRIGGER update_legs_updated_at
BEFORE UPDATE ON public.legs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parlays_updated_at
BEFORE UPDATE ON public.parlays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_legs_user_id ON public.legs(user_id);
CREATE INDEX idx_legs_game_date ON public.legs(game_date);
CREATE INDEX idx_legs_status ON public.legs(status);
CREATE INDEX idx_parlays_user_id ON public.parlays(user_id);
CREATE INDEX idx_parlay_legs_parlay_id ON public.parlay_legs(parlay_id);
CREATE INDEX idx_parlay_legs_leg_id ON public.parlay_legs(leg_id);
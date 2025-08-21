-- Update default stake amount to $10 (1000 cents) for all weeks
ALTER TABLE public.weeks ALTER COLUMN stake_amount SET DEFAULT 1000;

-- Update existing weeks to have $10 stake
UPDATE public.weeks SET stake_amount = 1000 WHERE stake_amount != 1000;
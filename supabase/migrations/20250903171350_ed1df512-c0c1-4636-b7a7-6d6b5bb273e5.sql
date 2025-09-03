-- Check current enum values and fix weeks data
-- First, close old playoff weeks (week_number >= 19) and fix stake amounts
UPDATE weeks 
SET status = 'FINALIZED'
WHERE week_number >= 19;

-- Update any weeks with incorrect stake amounts to $10 (1000 cents)
UPDATE weeks 
SET stake_amount = 1000
WHERE stake_amount != 1000 AND status = 'OPEN';

-- Create a new current week with correct $10 stake if none exists with proper settings
INSERT INTO weeks (
  season_id,
  week_number,
  stake_amount,
  opens_at,
  locks_at,
  status
) 
SELECT 
  (SELECT id FROM seasons ORDER BY created_at DESC LIMIT 1),
  1,
  1000,  -- $10.00 in cents
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '14 days',
  'OPEN'
WHERE NOT EXISTS (
  SELECT 1 FROM weeks 
  WHERE status = 'OPEN' 
  AND stake_amount = 1000 
  AND opens_at <= NOW() 
  AND locks_at > NOW()
);
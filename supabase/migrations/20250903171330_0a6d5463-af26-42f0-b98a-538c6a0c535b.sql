-- Fix weeks data: Close old playoff weeks and create a proper current week with $10 stake
UPDATE weeks 
SET status = 'CLOSED' 
WHERE week_number >= 19 OR stake_amount != 1000;

-- Create a current week with correct $10 stake (1000 cents)
INSERT INTO weeks (
  season_id,
  week_number,
  stake_amount,
  opens_at,
  locks_at,
  status
) VALUES (
  (SELECT id FROM seasons ORDER BY created_at DESC LIMIT 1),
  1,
  1000,  -- $10.00 in cents
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '14 days',
  'OPEN'
) ON CONFLICT DO NOTHING;
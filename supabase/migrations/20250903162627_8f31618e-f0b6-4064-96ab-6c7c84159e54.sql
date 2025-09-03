-- Create 2024-25 NFL Season with proper playoff structure
-- First, update the existing season to cover the full 2024-25 season
UPDATE seasons 
SET 
  label = 'NFL 2024-25 Season',
  start_date = '2024-09-05 00:00:00+00',
  end_date = '2025-02-09 23:59:59+00'  -- Super Bowl date
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Delete the old outdated week
DELETE FROM weeks WHERE season_id = '550e8400-e29b-41d4-a716-446655440000';

-- Create current weeks for NFL playoffs (January 2025)
-- Week 19: Wild Card Weekend (January 11-13, 2025)
INSERT INTO weeks (id, season_id, week_number, status, opens_at, locks_at, stake_amount) VALUES
('11111111-1111-4111-8111-111111111119', '550e8400-e29b-41d4-a716-446655440000', 19, 'OPEN', 
 '2025-01-06 16:00:00+00', '2025-01-11 18:00:00+00', 1000);

-- Week 20: Divisional Round (January 18-19, 2025)  
INSERT INTO weeks (id, season_id, week_number, status, opens_at, locks_at, stake_amount) VALUES
('11111111-1111-4111-8111-111111111120', '550e8400-e29b-41d4-a716-446655440000', 20, 'OPEN',
 '2025-01-13 16:00:00+00', '2025-01-18 16:30:00+00', 1000);

-- Week 21: Conference Championship (January 26, 2025)
INSERT INTO weeks (id, season_id, week_number, status, opens_at, locks_at, stake_amount) VALUES  
('11111111-1111-4111-8111-111111111121', '550e8400-e29b-41d4-a716-446655440000', 21, 'OPEN',
 '2025-01-20 16:00:00+00', '2025-01-26 15:00:00+00', 1000);

-- Week 22: Super Bowl (February 9, 2025)
INSERT INTO weeks (id, season_id, week_number, status, opens_at, locks_at, stake_amount) VALUES
('11111111-1111-4111-8111-111111111122', '550e8400-e29b-41d4-a716-446655440000', 22, 'OPEN',
 '2025-01-27 16:00:00+00', '2025-02-09 18:30:00+00', 2000);
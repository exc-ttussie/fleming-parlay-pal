// Shared database types that match the actual Supabase schema

export interface Leg {
  id: string;
  user_id: string;
  week_id: string;
  sport_key: string;
  league: string;
  game_id?: string;
  game_desc: string;
  market_key: string;
  selection: string;
  line?: number; // Optional in database
  american_odds: number;
  decimal_odds: number;
  source: string;
  bookmaker: string;
  notes?: string;
  status: 'PENDING' | 'OK' | 'DUPLICATE' | 'CONFLICT' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface Parlay {
  id: string;
  week_id: string;
  combined_decimal: number;
  combined_american: number;
  stake_amount: number;
  projected_payout: number;
  legs_count: number;
  summary_json: any;
  created_at: string;
  updated_at: string;
}

export interface Week {
  id: string;
  season_id: string;
  week_number: number;
  status: 'OPEN' | 'LOCKED' | 'FINALIZED';
  opens_at: string;
  locks_at: string;
  finalized_at?: string;
  stake_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  team_name?: string;
  role: 'MEMBER' | 'COMMISSIONER';
  created_at: string;
  updated_at: string;
}
// Utility functions for handling betting props and market formatting

export const formatPropDisplayName = (propType: string): string => {
  const formatMap: { [key: string]: string } = {
    // Passing props
    'player_pass_yds': 'Passing Yards',
    'player_pass_tds': 'Passing TDs',
    'player_pass_completions': 'Completions',
    'player_pass_attempts': 'Pass Attempts',
    'player_pass_interceptions': 'Interceptions',
    'player_pass_longest_completion': 'Longest Completion',
    
    // Rushing props
    'player_rush_yds': 'Rushing Yards',
    'player_rush_tds': 'Rushing TDs',
    'player_rush_attempts': 'Rush Attempts',
    'player_rush_longest': 'Longest Rush',
    
    // Receiving props
    'player_receptions': 'Receptions',
    'player_reception_yds': 'Receiving Yards',
    'player_reception_tds': 'Receiving TDs',
    'player_reception_longest': 'Longest Reception',
    
    // Touchdown props
    'player_anytime_td': 'Anytime TD',
    'player_1st_td': 'First TD',
    'player_last_td': 'Last TD',
    
    // Defensive props
    'player_sacks': 'Sacks',
    'player_tackles_assists': 'Tackles + Assists',
    'player_interceptions': 'Interceptions',
    'player_fumbles_recovered': 'Fumbles Recovered',
    
    // Kicking props
    'player_field_goals': 'Field Goals',
    'player_kicking_points': 'Kicking Points',
    'player_extra_points': 'Extra Points',
    
    // Combined props
    'player_pass_rush_reception_yds': 'Pass + Rush + Rec Yards',
    'player_rush_reception_yds': 'Rush + Rec Yards',
    'player_pass_reception_yds': 'Pass + Rec Yards',
    
    // Game markets
    'h2h': 'Moneyline',
    'spreads': 'Point Spread',
    'totals': 'Total Points',
    'total': 'Total Points'
  };
  
  return formatMap[propType] || propType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatLegDescription = (leg: { 
  player_name?: string | null; 
  prop_type?: string | null; 
  selection: string;
  market_key: string;
}): string => {
  if (leg.player_name && leg.prop_type) {
    // Player prop: "Player Name - Prop Type: Selection"
    return `${leg.player_name} - ${formatPropDisplayName(leg.prop_type)}: ${leg.selection}`;
  } else {
    // Game bet: just show selection
    return leg.selection;
  }
};

export const getBetTypeCategory = (leg: { 
  player_name?: string | null; 
  prop_type?: string | null; 
  market_key: string;
}): 'player_prop' | 'game_bet' => {
  return leg.player_name && leg.prop_type ? 'player_prop' : 'game_bet';
};

export const isAnytimeTouchdownProp = (marketKey: string): boolean => {
  return marketKey === 'player_anytime_td';
};

export const isTouchdownProp = (marketKey: string): boolean => {
  return ['player_anytime_td', 'player_1st_td', 'player_last_td'].includes(marketKey);
};
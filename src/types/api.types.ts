export interface LeaderboardItem {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  global_rank: number;
  tier: string;
  win_rate: number;
  current_streak: number; // added since repository query includes it
}

export interface PlayerStats {
  id: string;
  user_id: string;
  bio: string | null;
  playing_hand: string;
  play_style: string;
  total_points: number;
  global_rank: number;
  tier: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  current_streak: number;
  smash_power: number;
  stamina: number;
}

export interface MatchHistoryItem {
  id: string;
  opponent_name: string;
  result: "W" | "L";
  score: string;
  match_date: string;
  category: string;
}

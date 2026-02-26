export interface RecentMatch {
  id: string;
  opponent_name: string;
  result: "W" | "L";
  score: string;
  match_date: string;
  category: string;
}

export interface FullPlayerProfile {
  // From Users Table
  id: string;
  full_name: string;
  avatar_url: string | null;
  join_date: string;

  // From Players Table
  bio: string | null;
  playing_hand: "LEFT" | "RIGHT" | "BOTH";
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

  // Combined Data
  recent_matches: RecentMatch[];
}

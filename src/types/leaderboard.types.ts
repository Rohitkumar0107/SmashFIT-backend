export interface LeaderboardPlayer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  global_rank: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER';
  win_rate: number;
  current_streak: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
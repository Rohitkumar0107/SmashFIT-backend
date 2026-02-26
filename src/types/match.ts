export interface Player {
    id: string;
    name: string;
}

export interface MatchScore {
    id: string;
    match_id: string;
    set_number: number;
    side_a_score: number;
    side_b_score: number;
    is_completed: boolean;
}

export interface MatchDetails {
    id: string;
    tournament_id: string;
    tournament_name: string;
    match_type: 'Singles' | 'Doubles';
    category: string;
    round_name: string;
    status: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';
    court_name: string;
    side_a_players: Player[];
    side_b_players: Player[];
    scores: MatchScore[];
    duration_minutes?: number;
    started_at?: Date;
    serving_side: 'Side_A' | 'Side_B';
}
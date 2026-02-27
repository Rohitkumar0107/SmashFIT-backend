export interface TournamentCategoryRequest {
  category_name: string; // e.g., "Men's Singles", "U-15 Boys"
  match_type: string;    // e.g., "SINGLES", "DOUBLES", "MIXED"
  entry_fee: number;
  max_slots: number;
  min_age?: number;      // Optional
  max_age?: number;      // Optional
}

export interface TournamentRequest {
  org_id: string;        // Jis organization ke andar ye ho raha hai
  name: string;
  description?: string;
  location: string;
  banner_url?: string;
  tournament_type: string; // e.g., "KNOCKOUT", "LEAGUE"
  shuttle_type: string;    // e.g., "FEATHER", "NYLON"
  start_date: string;      // YYYY-MM-DD
  end_date: string;        // YYYY-MM-DD
  registration_deadline: string; // YYYY-MM-DDTHH:mm:ssZ
  categories: TournamentCategoryRequest[]; // 👈 Array of categories
}

export interface RegistrationRequest {
  category_id: string;
  player_1_id: string; // Jo login hai (ya jisko select kiya hai)
  player_2_id?: string; // Doubles ke liye (Optional)
  team_name?: string; // Optional
}
import { TournamentRepository } from '../repositories/tournament.repository';

export class TournamentService {
  private tournamentRepo: TournamentRepository;

  constructor() {
    this.tournamentRepo = new TournamentRepository();
  }

  async getAllTournaments() {
    const tournaments = await this.tournamentRepo.fetchAllTournaments();
    
    // Frontend ke hisaab se mapping
    return tournaments.map(t => ({
      id: t.id,
      name: t.name,
      location: t.location,
      startDate: t.start_date,
      status: t.status,
      banner: t.banner_url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop', // Default fallback
      participants: 0, // Abhi ke liye 0, baad mein registration count lagayenge
      prizePool: '₹50,000' // Mock data
    }));
  }

  async getTournamentDetails(id: string) {
    const tournament = await this.tournamentRepo.fetchTournamentById(id);
    if (!tournament) return null;

    const categories = await this.tournamentRepo.fetchCategoriesByTournamentId(id);

    return {
      id: tournament.id,
      name: tournament.name,
      organizer: 'SmashFIT Admin', // Ise baad mein organizer_id se fetch karenge
      location: tournament.location,
      startDate: tournament.start_date,
      endDate: tournament.end_date,
      registrationDeadline: tournament.registration_deadline,
      status: tournament.status,
      banner: tournament.banner_url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
      description: tournament.description || 'Welcome to the tournament!',
      prizePool: '₹50,000',
      rules: [
        'Standard BWF scoring system (Best of 3, 21 points).',
        'Non-marking shoes are strictly mandatory.',
        'Players must report 30 minutes before their scheduled match.'
      ],
      categories: categories.map(c => ({
        id: c.id,
        name: c.category_name,
        type: c.match_type,
        slots: c.max_slots,
        filled: c.current_slots || 0,
        fee: '₹500' // Hardcoded for MVP
      }))
    };
  }
}

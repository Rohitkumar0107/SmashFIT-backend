import { TournamentRepository } from "../repositories/tournament.repository";
import { TournamentRequest } from "../models/tournament.model";

export class TournamentService {
  async createTournament(organizerId: string, data: TournamentRequest) {
    // Basic Validations
    if (!data.name || !data.org_id || !data.start_date || !data.end_date) {
      throw new Error(
        "Missing required tournament fields (name, org_id, dates).",
      );
    }

    if (!data.categories || data.categories.length === 0) {
      throw new Error(
        "At least one category is required to create a tournament.",
      );
    }

    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const deadline = new Date(data.registration_deadline);

    if (endDate < startDate) {
      throw new Error("End date cannot be before the start date.");
    }

    if (deadline > endDate) {
      throw new Error(
        "Registration deadline cannot be after the tournament ends.",
      );
    }

    const tournamentRepository = new TournamentRepository();
    const result = await tournamentRepository.createTournamentWithCategories(
      organizerId,
      data,
    );

    return result;
  }

  async getAllTournaments() {
    const tournamentRepository = new TournamentRepository();
    return await tournamentRepository.findAll();
  }

  async getTournamentById(id: string) {
    const tournamentRepository = new TournamentRepository();
    const tournament = await tournamentRepository.findById(id);

    if (!tournament) {
      throw new Error("Tournament not found");
    }
    return tournament;
  }

  // Import RegistrationRequest at the top if you haven't
  async registerForTournament(playerId: string, data: any) {
    if (!data.category_id) {
      throw new Error("Category ID is required to register.");
    }

    // Auto-assign player_1_id to the logged-in user if not explicitly sent
    const registrationData = {
      ...data,
      player_1_id: data.player_1_id || playerId,
    };

    const tournamentRepository = new TournamentRepository();

    // defensive duplicate check before hitting DB insert
    const already = await tournamentRepository.isPlayerRegistered(
      registrationData.category_id,
      registrationData.player_1_id,
    );
    if (already) {
      throw new Error("You are already registered for this category.");
    }

    return await tournamentRepository.registerPlayer(registrationData);
  }
}

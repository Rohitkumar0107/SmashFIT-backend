import { Response } from "express";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";
import { TournamentService } from "../services/tournament.service";

export const createTournament = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const organizerId = req.user.id;

    const tournamentService = new TournamentService();
    const newTournament = await tournamentService.createTournament(
      organizerId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Tournament draft created successfully!",
      data: newTournament,
    });
  } catch (error: any) {
    console.error("Tournament Create Error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllTournaments = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const tournamentService = new TournamentService();
    const tournaments = await tournamentService.getAllTournaments();
    res.status(200).json({ success: true, data: tournaments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getTournamentById = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const id = req.params.id as string;
    const tournamentService = new TournamentService();
    const tournament = await tournamentService.getTournamentById(id);

    res.status(200).json({ success: true, data: tournament });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const registerPlayer = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const playerId = req.user.id; // Logged-in player ka ID
    const tournamentService = new TournamentService();

    const registration = await tournamentService.registerForTournament(
      playerId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Successfully registered for the tournament!",
      data: registration,
    });
  } catch (error: any) {
    // either the database threw a unique constraint error or our manual check
    if (
      error.code === "23505" ||
      error.message?.toLowerCase().includes("already registered")
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You are already registered for this category.",
        });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

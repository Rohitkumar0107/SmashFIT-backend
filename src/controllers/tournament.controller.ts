import { Request, Response } from 'express';
import { TournamentService } from '../services/tournament.service';

const tournamentService = new TournamentService();

export const getTournaments = async (req: Request, res: Response) => {
  try {
    const tournaments = await tournamentService.getAllTournaments();
    res.status(200).json({ success: true, count: tournaments.length, data: tournaments });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getTournamentDetails = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tournament = await tournamentService.getTournamentDetails(id);
    
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    console.error("Error fetching tournament details:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
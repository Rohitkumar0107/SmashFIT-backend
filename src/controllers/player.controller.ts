import { Request, Response } from 'express';
import { PlayerService } from '../services/player.service';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

// Service object bahar define kiya for better performance
const playerService = new PlayerService();

export const getPlayerProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const profileData = await playerService.getFullProfile(id);

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error: any) {
    const status = error.message === "Player profile not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = await playerService.getHistory(id);

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error: any) {
    const status = error.message === "Player history not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
};
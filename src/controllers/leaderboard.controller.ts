import { Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service';
import { APIResponse, LeaderboardPlayer } from '../types/leaderboard.types';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

// Service object bahar define kiya for memory efficiency
const leaderboardService = new LeaderboardService();

export const getGlobalLeaderboard = async (req: AuthenticatedRequest, res: Response<APIResponse<LeaderboardPlayer[] | null>>) => {
  try {
    const data = await leaderboardService.getLeaderboardData();
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message
    });
  }
};

export const getTopPlayers = async (req: AuthenticatedRequest, res: Response<APIResponse<LeaderboardPlayer[] | null>>) => {
  try {
    const data = await leaderboardService.getTop(5);
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message
    });
  }
};
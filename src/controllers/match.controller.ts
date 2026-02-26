import { Request, Response } from 'express';
import * as matchService from '../services/match.service';

export const getMatchById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const match = await matchService.getMatchDetails(id);
        
        return res.status(200).json({
            success: true,
            data: match
        });
    } catch (error: any) {
        if (error.message === 'MATCH_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Match nahi mila bhai!' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Isko getMatchById ke neeche add karo
export const getAllMatches = async (req: Request, res: Response) => {
    try {
        const matches = await matchService.getAllMatches();
        
        return res.status(200).json({
            success: true,
            count: matches.length,
            data: matches
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
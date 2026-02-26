import * as matchRepository from '../repositories/match.repository';
import { MatchDetails } from '../types/match';

export const getMatchDetails = async (id: string): Promise<MatchDetails> => {
    const match = await matchRepository.findMatchById(id);
    
    if (!match) {
        throw new Error('MATCH_NOT_FOUND');
    }

    // Logic for duration
    if (match.started_at) {
        const start = new Date(match.started_at).getTime();
        const now = new Date().getTime();
        match.duration_minutes = Math.floor((now - start) / 60000);
    }

    return match;
};

// Isko getMatchDetails ke neeche add karo
export const getAllMatches = async (): Promise<MatchDetails[]> => {
    const matches = await matchRepository.findAllMatches();
    
    // Yahan tum filtering logic bhi daal sakte ho agar zaroorat pade
    return matches;
};
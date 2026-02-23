import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { LoggedInUser } from '../types/LoggedInUser';

export const verifyAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // 1. Token nikalna (Header aam taur par "Bearer <token>" format mein hota hai)
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Access Denied. No token provided." });
        }

        const token = authHeader.split(' ')[1];

        // 2. Token Verify karna (Jo utils humne pehle banaye the)
        // 'as any' ya apna custom interface lagao
        const decodedUser = verifyToken(token) as LoggedInUser; 
        req.user = decodedUser;

        // 3. User ka data request mein daal do taaki aage controllers use kar sakein
        req.user = decodedUser;

        // 4. Sab sahi hai, aage badho (Controller ke paas jao)
        next();

    } catch (error) {
        // Agar token expire ho gaya hai ya galat hai
        return res.status(401).json({ message: "Invalid or Expired Token." });
    }
};
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { UserRequest } from '../models/comman.model';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

const register = async(req: AuthenticatedRequest,res: Response) =>{
    try{
        const userData: UserRequest  = req.body;

        if (!userData.email || !userData.password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const service = new authService();
        const result= await service.registerUser(userData);
        
        return res.status(201).json({
            success: true,
            message: "User registered successfully"
        });

    }catch (error: any) {
        // 4. Detailed Error Handling
        console.error("Registration Error:", error);

        // Agar service se specific error aa raha hai (e.g. User already exists)
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';

        return res.status(statusCode).json({ 
            success: false,
            message 
        });
    }
};

const login = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const service = new authService();
        const result = await service.loginUser(req.body);

        // Professional way: Refresh token ko HttpOnly cookie mein daalna
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: true, // Production mein true rakhein
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });

    } catch (error: any) {
        return res.status(401).json({ success: false, message: error.message });
    }
}

export const logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // 1. Client ki incoming request se Refresh Token nikalo
        // Agar body mein bhej rahe ho toh req.body.refreshToken hoga, 
        // par cookies best practice hai
        const refreshToken = req.cookies?.refreshToken; 

        // 2. Database se token uda do (Service call)
        const service = new authService();
        await service.logoutUser(refreshToken);

        // 3. Browser se Cookie ko clear kar do
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict'
        });

        // 4. Frontend ko success response bhej do
        return res.status(200).json({
            success: true,
            message: "User logged out securely"
        });

    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error during logout' 
        });
    }
};

export const refreshToken = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // 1. Cookie se token nikalo
        const incomingToken = req.cookies?.refreshToken;
        
        if (!incomingToken) {
            return res.status(401).json({ success: false, message: "No refresh token provided" });
        }

        // 2. Service call karo naye tokens ke liye
        const service = new authService();
        const tokens = await service.refreshAccessToken(incomingToken);

        // 3. Nayi Cookie set karo naye refresh token ke sath
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // 4. Naya Access Token response mein bhejo
        return res.status(200).json({
            success: true,
            accessToken: tokens.accessToken
        });

    } catch (error: any) {
        console.error("Refresh Token Error:", error);
        // Agar error aaye, toh frontend ko 403 (Forbidden) bhejte hain taaki wo force logout kar de
        return res.status(403).json({ success: false, message: error.message });
    }
};

export const googleAuth = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Frontend body mein idToken bhejega
        const { idToken, accessToken, refreshToken, expiresIn } = req.body; 

        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Google Token is required' });
        }

        const service = new authService();
        // Pura data service ko pass kar do
        const result = await service.googleLogin({ 
            idToken, 
            accessToken, 
            refreshToken, 
            expiresIn
        });

        // Refresh Token Cookie mein set karo
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            accessToken: result.accessToken,
        });

    } catch (error: any) {
        console.error("Google Auth Error:", error);
        return res.status(401).json({ success: false, message: 'Google Authentication Failed' });
    }
};

// src/controllers/auth.controller.ts

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Middleware ne req.user set kar diya hai
        const userId = req.user?.id; 

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID not found in token" });
        }

        const service = new authService();
        const user = await service.getUserProfile(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                full_name: user.fullName || user.full_name,
                email: user.email,
                picture: user.avatar_url || user.picture,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export default {
    register,
    login,
    logout,
    refreshToken,
    googleAuth,
    getProfile
}
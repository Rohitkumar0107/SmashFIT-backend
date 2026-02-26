import jwt from 'jsonwebtoken';

// 1. Secrets ko variables mein store karo (Default values ke saath taaki code phate nahi)
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'smashfit_dev_access_key_123';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'smashfit_dev_refresh_key_456';

// 2. Payload ka interface banao taaki TypeScript khush rahe
interface TokenPayload {
    id: string | number;
    email: string;
    role_name: string;
}

export const generateTokens = (payload: TokenPayload) => {
    try {
        // 3. Access Token: Ismein user ki identity aur role hai
        const accessToken = jwt.sign(
            { 
                id: payload.id, 
                email: payload.email, 
                role: payload.role_name // Frontend ke liye 'role' key
            }, 
            ACCESS_SECRET, // Upar wala variable use kiya
            { expiresIn: '15m' }
        );

        // 4. Refresh Token: Ismein sirf ID hai (Security best practice)
        const refreshToken = jwt.sign(
            { id: payload.id }, 
            REFRESH_SECRET, // Upar wala variable use kiya
            { expiresIn: '7d' }
        );

        return { accessToken, refreshToken };

    } catch (error) {
        console.error("Token Generation Error:", error);
        throw new Error("Failed to generate authentication tokens");
    }
};

export const verifyToken = (token: string, isRefresh = false) => {
    const secret = isRefresh ? REFRESH_SECRET : ACCESS_SECRET;
    return jwt.verify(token, secret);
};
import jwt from 'jsonwebtoken';



// 1. Secrets ko variables mein store karo 
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'smashfit_dev_access_key_123';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'smashfit_dev_refresh_key_456';
// [NEW] Reset password token ke liye ek alag secret bana diya for extra security
const RESET_SECRET = process.env.RESET_TOKEN_SECRET || 'smashfit_dev_reset_key_789';

// 2. Payload ka interface banao taaki TypeScript khush rahe
export interface TokenPayload {
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
            ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        // 4. Refresh Token: Ismein sirf ID hai (Security best practice)
        const refreshToken = jwt.sign(
            { id: payload.id },
            REFRESH_SECRET,
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

// --- NAYE FUNCTIONS: Sirf Reset Password Flow Ke Liye ---

export const generateResetToken = (userId: string | number) => {
    // Ye sirf 15 minute ke liye banega aur isme extra 'purpose' key hogi
    return jwt.sign(
        { id: userId, purpose: 'RESET' },
        RESET_SECRET,
        { expiresIn: '15m' }
    );
};

export const verifyResetToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, RESET_SECRET) as any;

        // Check karo ki kisi ne Access Token daal kar password reset karne ki koshish toh nahi ki
        if (!decoded || decoded.purpose !== 'RESET') {
            throw new Error("Invalid token purpose");
        }

        return decoded; // Isme se hume id mil jayegi password update karne ke liye
    } catch (error) {
        throw new Error("Invalid or expired reset token");
    }
};
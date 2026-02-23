import jwt from 'jsonwebtoken';

// Inhe .env file se uthana best hai
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'super_secret_access';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'super_secret_refresh';

export const generateTokens = (payload: { id: string | number, email: string }) => {
    
    const accessToken = jwt.sign(payload, ACCESS_SECRET, {
        expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ id: payload.id }, REFRESH_SECRET, {
        expiresIn: '7d',
    });

    return { accessToken, refreshToken };
};

export const verifyToken = (token: string, isRefresh = false) => {
    const secret = isRefresh ? REFRESH_SECRET : ACCESS_SECRET;
    return jwt.verify(token, secret);
};
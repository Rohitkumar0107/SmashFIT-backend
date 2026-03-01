"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyResetToken = exports.generateResetToken = exports.verifyToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// 1. Secrets ko variables mein store karo 
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'smashfit_dev_access_key_123';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'smashfit_dev_refresh_key_456';
// [NEW] Reset password token ke liye ek alag secret bana diya for extra security
const RESET_SECRET = process.env.RESET_TOKEN_SECRET || 'smashfit_dev_reset_key_789';
const generateTokens = (payload) => {
    try {
        // 3. Access Token: Ismein user ki identity aur role hai
        const accessToken = jsonwebtoken_1.default.sign({
            id: payload.id,
            email: payload.email,
            role: payload.role_name // Frontend ke liye 'role' key
        }, ACCESS_SECRET, { expiresIn: '15m' });
        // 4. Refresh Token: Ismein sirf ID hai (Security best practice)
        const refreshToken = jsonwebtoken_1.default.sign({ id: payload.id }, REFRESH_SECRET, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error("Token Generation Error:", error);
        throw new Error("Failed to generate authentication tokens");
    }
};
exports.generateTokens = generateTokens;
const verifyToken = (token, isRefresh = false) => {
    const secret = isRefresh ? REFRESH_SECRET : ACCESS_SECRET;
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
// --- NAYE FUNCTIONS: Sirf Reset Password Flow Ke Liye ---
const generateResetToken = (userId) => {
    // Ye sirf 15 minute ke liye banega aur isme extra 'purpose' key hogi
    return jsonwebtoken_1.default.sign({ id: userId, purpose: 'RESET' }, RESET_SECRET, { expiresIn: '15m' });
};
exports.generateResetToken = generateResetToken;
const verifyResetToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, RESET_SECRET);
        // Check karo ki kisi ne Access Token daal kar password reset karne ki koshish toh nahi ki
        if (!decoded || decoded.purpose !== 'RESET') {
            throw new Error("Invalid token purpose");
        }
        return decoded; // Isme se hume id mil jayegi password update karne ke liye
    }
    catch (error) {
        throw new Error("Invalid or expired reset token");
    }
};
exports.verifyResetToken = verifyResetToken;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// 1. Secrets ko variables mein store karo (Default values ke saath taaki code phate nahi)
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'smashfit_dev_access_key_123';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'smashfit_dev_refresh_key_456';
const generateTokens = (payload) => {
    try {
        // 3. Access Token: Ismein user ki identity aur role hai
        const accessToken = jsonwebtoken_1.default.sign({
            id: payload.id,
            email: payload.email,
            role: payload.role_name // Frontend ke liye 'role' key
        }, ACCESS_SECRET, // Upar wala variable use kiya
        { expiresIn: '15m' });
        // 4. Refresh Token: Ismein sirf ID hai (Security best practice)
        const refreshToken = jsonwebtoken_1.default.sign({ id: payload.id }, REFRESH_SECRET, // Upar wala variable use kiya
        { expiresIn: '7d' });
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

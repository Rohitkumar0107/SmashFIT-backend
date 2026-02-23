"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Inhe .env file se uthana best hai
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'super_secret_access';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'super_secret_refresh';
const generateTokens = (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, {
        expiresIn: '15m',
    });
    const refreshToken = jsonwebtoken_1.default.sign({ id: payload.id }, REFRESH_SECRET, {
        expiresIn: '7d',
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyToken = (token, isRefresh = false) => {
    const secret = isRefresh ? REFRESH_SECRET : ACCESS_SECRET;
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;

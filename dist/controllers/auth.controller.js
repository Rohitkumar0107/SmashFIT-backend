"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.googleAuth = exports.refreshToken = exports.logout = void 0;
const auth_service_1 = require("../services/auth.service");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userData = req.body;
        if (!userData.email || !userData.password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const service = new auth_service_1.authService();
        const result = yield service.registerUser(userData);
        return res.status(201).json({
            success: true,
            message: "User registered successfully"
        });
    }
    catch (error) {
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
});
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const service = new auth_service_1.authService();
        const result = yield service.loginUser(req.body);
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
    }
    catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
});
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1. Client ki incoming request se Refresh Token nikalo
        // Agar body mein bhej rahe ho toh req.body.refreshToken hoga, 
        // par cookies best practice hai
        const refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        // 2. Database se token uda do (Service call)
        const service = new auth_service_1.authService();
        yield service.logoutUser(refreshToken);
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
    }
    catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error during logout'
        });
    }
});
exports.logout = logout;
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1. Cookie se token nikalo
        const incomingToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        if (!incomingToken) {
            return res.status(401).json({ success: false, message: "No refresh token provided" });
        }
        // 2. Service call karo naye tokens ke liye
        const service = new auth_service_1.authService();
        const tokens = yield service.refreshAccessToken(incomingToken);
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
    }
    catch (error) {
        console.error("Refresh Token Error:", error);
        // Agar error aaye, toh frontend ko 403 (Forbidden) bhejte hain taaki wo force logout kar de
        return res.status(403).json({ success: false, message: error.message });
    }
});
exports.refreshToken = refreshToken;
const googleAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Frontend body mein idToken bhejega
        const { idToken, accessToken, refreshToken, expiresIn } = req.body;
        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Google Token is required' });
        }
        const service = new auth_service_1.authService();
        // Pura data service ko pass kar do
        const result = yield service.googleLogin({
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
    }
    catch (error) {
        console.error("Google Auth Error:", error);
        return res.status(401).json({ success: false, message: 'Google Authentication Failed' });
    }
});
exports.googleAuth = googleAuth;
// src/controllers/auth.controller.ts
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Middleware ne req.user set kar diya hai
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID not found in token" });
        }
        const service = new auth_service_1.authService();
        const user = yield service.getUserProfile(userId);
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
    }
    catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
exports.getProfile = getProfile;
exports.default = {
    register,
    login,
    logout: exports.logout,
    refreshToken: exports.refreshToken,
    googleAuth: exports.googleAuth,
    getProfile: exports.getProfile
};

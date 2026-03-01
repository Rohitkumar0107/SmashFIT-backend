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
exports.verifyEmail = exports.getProfile = exports.ssoCallback = exports.refreshToken = exports.logout = exports.verifyOAuthOtp = exports.verifyLoginOtp = exports.verifyRegistrationOtp = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userData = req.body;
        if (!userData.email || !userData.password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }
        const service = new auth_service_1.authService();
        const result = yield service.registerUser(userData);
        return res.status(201).json({
            success: true,
            message: result.message, // "Account pending. OTP sent..."
        });
    }
    catch (error) {
        // 4. Detailed Error Handling
        console.error("Registration Error:", error);
        // Agar service se specific error aa raha hai (e.g. User already exists)
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal Server Error";
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const service = new auth_service_1.authService();
        // Instead of directly logging in, initiate OTP flow
        const result = yield service.initiateLoginOtp(req.body.email, req.body.password);
        return res.status(200).json({
            success: true,
            message: result.message,
            email: result.email,
        });
    }
    catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
});
exports.login = login;
const verifyRegistrationOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res
                .status(400)
                .json({ success: false, message: "Email and OTP are required" });
        }
        const service = new auth_service_1.authService();
        const result = yield service.verifyRegistrationOtp(email, otp);
        // Save the refresh token in an HTTP-only cookie
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(200).json({
            success: true,
            message: "Registration completed successfully",
            user: result.user,
            token: result.accessToken,
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.verifyRegistrationOtp = verifyRegistrationOtp;
// NEW: Verify Login OTP
const verifyLoginOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res
                .status(400)
                .json({ success: false, message: "Email and OTP are required" });
        }
        const service = new auth_service_1.authService();
        const result = yield service.verifyLoginOtp(email, otp);
        // Save the refresh token in an HTTP-only cookie
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: result.user,
            token: result.accessToken,
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.verifyLoginOtp = verifyLoginOtp;
// NEW: Verify OAuth OTP
const verifyOAuthOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res
                .status(400)
                .json({ success: false, message: "Email and OTP are required" });
        }
        const service = new auth_service_1.authService();
        const result = yield service.verifyOAuthOtp(email, otp);
        // Save the refresh token in an HTTP-only cookie
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(200).json({
            success: true,
            message: "OAuth login verified successfully",
            user: result.user,
            token: result.accessToken,
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.verifyOAuthOtp = verifyOAuthOtp;
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
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        // 4. Frontend ko success response bhej do
        return res.status(200).json({
            success: true,
            message: "User logged out securely",
        });
    }
    catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error during logout",
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
            return res
                .status(401)
                .json({ success: false, message: "No refresh token provided" });
        }
        // 2. Service call karo naye tokens ke liye
        const service = new auth_service_1.authService();
        const tokens = yield service.refreshAccessToken(incomingToken);
        // 3. Nayi Cookie set karo naye refresh token ke sath
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // 4. Naya Access Token response mein bhejo
        return res.status(200).json({
            success: true,
            accessToken: tokens.accessToken,
        });
    }
    catch (error) {
        console.error("Refresh Token Error:", error);
        // Agar error aaye, toh frontend ko 403 (Forbidden) bhejte hain taaki wo force logout kar de
        return res.status(403).json({ success: false, message: error.message });
    }
});
exports.refreshToken = refreshToken;
const ssoCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Frontend body mein idToken bhejega
        const { idToken, accessToken, refreshToken, expiresIn } = req.body;
        if (!idToken) {
            return res
                .status(400)
                .json({ success: false, message: "Google Token is required" });
        }
        const service = new auth_service_1.authService();
        // Instead of directly logging in, initiate OTP flow
        const result = yield service.initiateOAuthOtpFromGoogle({
            idToken,
            accessToken,
            refreshToken,
            expiresIn,
        });
        return res.status(200).json({
            success: true,
            message: result.message,
            email: result.email,
        });
    }
    catch (error) {
        console.error("Google Auth Error:", error);
        return res
            .status(401)
            .json({ success: false, message: "Google Authentication Failed" });
    }
});
exports.ssoCallback = ssoCallback;
// src/controllers/auth.controller.ts
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Middleware ne req.user set kar diya hai
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res
                .status(400)
                .json({ success: false, message: "User ID not found in token" });
        }
        const service = new auth_service_1.authService();
        const user = yield service.getUserProfile(userId);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                full_name: user.fullName || user.full_name,
                email: user.email,
                picture: user.avatar_url || user.picture,
                role: user.role_name || user.role, // DB join se aayega
            },
        });
    }
    catch (error) {
        console.error("Get Profile Error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
});
exports.getProfile = getProfile;
// [NEW] Email verification via token. The token encodes email:otp in base64.
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        if (!token) {
            return res
                .status(400)
                .json({ success: false, message: "Token is required" });
        }
        const decoded = Buffer.from(token, "base64").toString("utf-8");
        const [email, otp] = decoded.split(":");
        if (!email || !otp) {
            throw new Error("Invalid verification token");
        }
        // reuse existing OTP verification logic
        const service = new auth_service_1.authService();
        const result = yield service.verifyRegistrationOtp(email, otp);
        // set refresh cookie
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(200).json({
            success: true,
            message: "Email verified and logged in",
            user: result.user,
            token: result.accessToken,
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.verifyEmail = verifyEmail;
// [NEW] Forgot Password (Send OTP)
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const service = new auth_service_1.authService();
        yield service.forgotPassword(req.body.email);
        return res.status(200).json({
            success: true,
            message: "If the email is registered, an OTP has been sent.",
        });
    }
    catch (error) {
        // Humesha 200 return karo security ke liye (Email enumeration bachane ke liye)
        return res.status(200).json({
            success: true,
            message: "If the email is registered, an OTP has been sent.",
        });
    }
});
// [NEW] Verify Reset OTP
const verifyResetOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const service = new auth_service_1.authService();
        const resetToken = yield service.verifyResetOtp(req.body.email, req.body.otp);
        return res.status(200).json({
            success: true,
            message: "OTP verified",
            resetToken,
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
// [NEW] Reset Password
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Bearer token se nikal lo resetToken
        const resetToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!resetToken)
            throw new Error("Reset token missing");
        const service = new auth_service_1.authService();
        yield service.resetPassword(resetToken, req.body.new_password);
        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now login.",
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
// NEW: Enable MFA
const enableMfa = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const email = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
        if (!userId || !email) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User context missing",
            });
        }
        const service = new auth_service_1.authService();
        const result = yield service.generateMfaSecret(userId, email);
        return res.status(200).json({
            success: true,
            message: "MFA setup generated",
            secret: result.secret,
            qrCodeUrl: result.qrCodeUrl,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = {
    register: exports.register,
    login: exports.login,
    verifyRegistrationOtp: exports.verifyRegistrationOtp,
    verifyLoginOtp: exports.verifyLoginOtp,
    verifyOAuthOtp: exports.verifyOAuthOtp,
    verifyEmail: exports.verifyEmail,
    logout: exports.logout,
    refreshToken: exports.refreshToken,
    ssoCallback: exports.ssoCallback,
    getProfile: exports.getProfile,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    enableMfa,
};

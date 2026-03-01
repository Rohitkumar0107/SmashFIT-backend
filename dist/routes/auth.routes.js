"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// auth.routes.ts
const express_1 = __importStar(require("express"));
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(express_1.default.json());
router.post("/register", auth_controller_1.default.register);
// [NEW] Registration OTP Verification
router.post("/verify-register-otp", auth_controller_1.default.verifyRegistrationOtp);
// --- LOGIN (Now returns OTP requirement) ---
router.post("/login", auth_controller_1.default.login);
// [NEW] Login OTP Verification
router.post("/verify-login-otp", auth_controller_1.default.verifyLoginOtp);
// --- SSO ---
router.get("/oauth/:provider", (req, res) => {
    // Basic redirect for provider start if needed by frontend
    const provider = req.params.provider;
    res.status(200).json({
        success: true,
        message: `Initialize ${provider} oauth flow from frontend`,
    });
});
router.post("/sso/callback", auth_controller_1.default.ssoCallback);
// [NEW] OAuth OTP Verification
router.post("/verify-oauth-otp", auth_controller_1.default.verifyOAuthOtp);
// NEW EMAIL VERIFICATION ENDPOINT (token-based)
router.post("/verify-email", auth_controller_1.default.verifyEmail);
// --- FORGOT & RESET PASSWORD ROUTES ---
router.post("/forgot-password", auth_controller_1.default.forgotPassword); // OTP bhejega
router.post("/verify-reset-otp", auth_controller_1.default.verifyResetOtp); // Reset Token dega
router.post("/reset-password", auth_controller_1.default.resetPassword); // Password change karega
// --- PURANE ROUTES ---
router.post("/refresh", auth_controller_1.default.refreshToken);
router.post("/logout", auth_middleware_1.verifyAuth, auth_controller_1.default.logout);
router.get("/me", auth_middleware_1.verifyAuth, auth_controller_1.default.getProfile);
// [NEW] MFA Routes
router.post("/mfa/enable", auth_middleware_1.verifyAuth, auth_controller_1.default.enableMfa);
exports.default = router;

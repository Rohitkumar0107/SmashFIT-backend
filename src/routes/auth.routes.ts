// auth.routes.ts
import express, { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();
router.use(express.json());

router.post("/register", AuthController.register);

// [NEW] Registration OTP Verification
router.post("/verify-register-otp", AuthController.verifyRegistrationOtp);

// --- LOGIN (Now returns OTP requirement) ---
router.post("/login", AuthController.login);

// [NEW] Login OTP Verification
router.post("/verify-login-otp", AuthController.verifyLoginOtp);

// --- SSO ---
router.get("/oauth/:provider", (req, res) => {
  // Basic redirect for provider start if needed by frontend
  const provider = req.params.provider;
  res.status(200).json({
    success: true,
    message: `Initialize ${provider} oauth flow from frontend`,
  });
});
router.post("/sso/callback", AuthController.ssoCallback);

// [NEW] OAuth OTP Verification
router.post("/verify-oauth-otp", AuthController.verifyOAuthOtp);

// NEW EMAIL VERIFICATION ENDPOINT (token-based)
router.post("/verify-email", AuthController.verifyEmail);

// --- FORGOT & RESET PASSWORD ROUTES ---
router.post("/forgot-password", AuthController.forgotPassword); // OTP bhejega
router.post("/verify-reset-otp", AuthController.verifyResetOtp); // Reset Token dega
router.post("/reset-password", AuthController.resetPassword); // Password change karega

// --- PURANE ROUTES ---
router.post("/refresh", AuthController.refreshToken);
router.post("/logout", verifyAuth, AuthController.logout);
router.get("/me", verifyAuth, AuthController.getProfile);

// [NEW] MFA Routes
router.post("/mfa/enable", verifyAuth, AuthController.enableMfa);

export default router;

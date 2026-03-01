import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { UserRequest } from "../models/comman.model";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userData: UserRequest = req.body;

    if (!userData.email || !userData.password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const service = new authService();
    const result = await service.registerUser(userData);

    return res.status(201).json({
      success: true,
      message: result.message, // "Account pending. OTP sent..."
    });
  } catch (error: any) {
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
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = new authService();
    // Instead of directly logging in, initiate OTP flow
    const result = await service.initiateLoginOtp(
      req.body.email,
      req.body.password,
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      email: result.email,
    });
  } catch (error: any) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export const verifyRegistrationOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const service = new authService();
    const result = await service.verifyRegistrationOtp(email, otp);

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
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// NEW: Verify Login OTP
export const verifyLoginOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const service = new authService();
    const result = await service.verifyLoginOtp(email, otp);

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
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// NEW: Verify OAuth OTP
export const verifyOAuthOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const service = new authService();
    const result = await service.verifyOAuthOtp(email, otp);

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
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Client ki incoming request se Refresh Token nikalo
    // Agar body mein bhej rahe ho toh req.body.refreshToken hoga,
    // par cookies best practice hai
    const refreshToken = req.cookies?.refreshToken;

    // 2. Database se token uda do (Service call)
    const service = new authService();
    await service.logoutUser(refreshToken);

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
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during logout",
    });
  }
};

export const refreshToken = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // 1. Cookie se token nikalo
    const incomingToken = req.cookies?.refreshToken;

    if (!incomingToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }

    // 2. Service call karo naye tokens ke liye
    const service = new authService();
    const tokens = await service.refreshAccessToken(incomingToken);

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
  } catch (error: any) {
    console.error("Refresh Token Error:", error);
    // Agar error aaye, toh frontend ko 403 (Forbidden) bhejte hain taaki wo force logout kar de
    return res.status(403).json({ success: false, message: error.message });
  }
};

export const ssoCallback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Frontend body mein idToken bhejega
    const { idToken, accessToken, refreshToken, expiresIn } = req.body;

    if (!idToken) {
      return res
        .status(400)
        .json({ success: false, message: "Google Token is required" });
    }

    const service = new authService();
    // Instead of directly logging in, initiate OTP flow
    const result = await service.initiateOAuthOtpFromGoogle({
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
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    return res
      .status(401)
      .json({ success: false, message: "Google Authentication Failed" });
  }
};

// src/controllers/auth.controller.ts

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Middleware ne req.user set kar diya hai
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID not found in token" });
    }

    const service = new authService();
    const user = await service.getUserProfile(userId);

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
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// [NEW] Email verification via token. The token encodes email:otp in base64.
export const verifyEmail = async (req: AuthenticatedRequest, res: Response) => {
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
    const service = new authService();
    const result = await service.verifyRegistrationOtp(email, otp);

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
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// [NEW] Forgot Password (Send OTP)
const forgotPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = new authService();
    await service.forgotPassword(req.body.email);

    return res.status(200).json({
      success: true,
      message: "If the email is registered, an OTP has been sent.",
    });
  } catch (error: any) {
    // Humesha 200 return karo security ke liye (Email enumeration bachane ke liye)
    return res.status(200).json({
      success: true,
      message: "If the email is registered, an OTP has been sent.",
    });
  }
};

// [NEW] Verify Reset OTP
const verifyResetOtp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = new authService();
    const resetToken = await service.verifyResetOtp(
      req.body.email,
      req.body.otp,
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified",
      resetToken,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// [NEW] Reset Password
const resetPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Bearer token se nikal lo resetToken
    const resetToken = req.headers.authorization?.split(" ")[1];
    if (!resetToken) throw new Error("Reset token missing");

    const service = new authService();
    await service.resetPassword(resetToken, req.body.new_password);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login.",
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// NEW: Enable MFA
const enableMfa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User context missing",
      });
    }

    const service = new authService();
    const result = await service.generateMfaSecret(userId, email);

    return res.status(200).json({
      success: true,
      message: "MFA setup generated",
      secret: result.secret,
      qrCodeUrl: result.qrCodeUrl,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  register,
  login,
  verifyRegistrationOtp,
  verifyLoginOtp,
  verifyOAuthOtp,
  verifyEmail,
  logout,
  refreshToken,
  ssoCallback,
  getProfile,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  enableMfa,
};

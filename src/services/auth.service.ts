import { UserRequest } from "../models/comman.model";
import { authRepository } from "../repositories/auth.repository";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "../utils/email.util";
import {
  getRegistrationOtpTemplate,
  getWelcomeEmailTemplate,
  getPasswordResetOtpTemplate,
} from "../utils/email-templates.util";
import {
  generateTokens,
  verifyToken,
  generateResetToken,
  verifyResetToken,
} from "../utils/jwt.utils";
import { OAuth2Client } from "google-auth-library";
import { generateSecret, generateURI } from "otplib";
import qrcode from "qrcode";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class authService {
  // Helper method to generate OTP
  private generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }

  async registerUser(userData: UserRequest) {
    const repository = new authRepository();

    // 1. Business Logic: Check if user already exists
    // Email se check kar rahe hain taaki duplicate accounts na banein
    const existingUser = await repository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("User already registered with this email");
    }

    // 2. Business Logic: Password Hashing
    // Plain text password ko secure hash mein convert karna
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // 3. Save to Pending OTPs table instead of Users table
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const pendingUserData = {
      fullName: userData.fullName,
      email: userData.email,
      password: hashedPassword,
    };

    await repository.saveOtp(
      userData.email,
      otp,
      "ACTIVATION",
      expiresAt,
      pendingUserData,
    );

    // 4. Send Email
    // build a token the frontend or user can POST back to /api/auth/verify-email
    const token = Buffer.from(`${userData.email}:${otp}`).toString("base64");
    const { subject, text, html } = getRegistrationOtpTemplate(otp, token);
    await sendEmail(userData.email, subject, text, html);

    return {
      message:
        "Account pending. OTP sent to your email to verify registration.",
    };
  }

  // --- NEW: Verify OTP and Finalize Registration ---
  async verifyRegistrationOtp(email: string, otp: string) {
    const repository = new authRepository();

    // 1. Verify OTP aur metadata nikaalo
    const verification = await repository.verifyAndDeleteOtp(
      email,
      otp,
      "ACTIVATION",
    );
    if (!verification.isValid) {
      throw new Error("Invalid or expired OTP");
    }

    // 2. Original registration payload recover karo
    const pendingUserData = verification.metadata;
    if (!pendingUserData) {
      throw new Error("Pending user data not found or corrupted.");
    }

    // 3. Database mein user create karo!
    const savedUser = await repository.registerUser(pendingUserData);

    // 4. Return tokens (jaise login mein karte hain) automatically login karne ke liye
    const tokens = generateTokens({
      id: savedUser.id,
      email: savedUser.email,
      role_name: savedUser.role_name,
    });

    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
    await repository.saveRefreshToken(
      savedUser.id,
      tokens.refreshToken,
      sessionExpiresAt,
    );

    // 5. Send Welcome Email
    const userName = savedUser.full_name || savedUser.fullName || "User";
    const { subject, text, html } = getWelcomeEmailTemplate(userName);

    // We can send this asynchronously so it doesn't block the login response speed
    sendEmail(savedUser.email, subject, text, html).catch(console.error);

    // Password hata do response se
    const { password, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async loginUser(loginData: any) {
    const repository = new authRepository();

    const user = await repository.findUserByEmail(loginData.email);
    if (!user) throw new Error("Invalid email or password");

    const isPasswordMatch = await bcrypt.compare(
      loginData.password,
      user.password,
    );
    if (!isPasswordMatch) throw new Error("Invalid email or password");

    // Since login doesn't need an OTP anymore, we issue JWTs immediately
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role_name: user.role_name,
    });

    // Refresh token ko DB mein save karo (session management)
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
    await repository.saveRefreshToken(
      user.id,
      tokens.refreshToken,
      sessionExpiresAt,
    );

    return {
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role_name,
      },
      ...tokens,
    };
  }

  async logoutUser(refreshToken: string) {
    if (!refreshToken) {
      return; // Agar token hai hi nahi, toh aage badhne ki zaroorat nahi
    }

    const repository = new authRepository();
    await repository.deleteRefreshToken(refreshToken);
  }

  async refreshAccessToken(incomingRefreshToken: string) {
    const repository = new authRepository();

    // 1. Cryptographically verify karo (jwt.util se)
    let decoded;
    try {
      decoded = verifyToken(incomingRefreshToken, true); // true matlab ye refresh token hai
    } catch (error) {
      throw new Error("Invalid or Expired Refresh Token");
    }

    // 2. Database mein check karo (kahi token blacklist toh nahi ho gaya?)
    const tokenInDb = await repository.findRefreshToken(incomingRefreshToken);
    if (!tokenInDb) {
      throw new Error("Refresh Token not found or revoked");
    }

    // 3. User exist karta hai ya nahi check karo (Safety check)
    // Note: TypeScript error se bachne ke liye 'decoded as any' ya properly type kar lena
    const user = await repository.findUserById((decoded as any).id);
    if (!user) {
      throw new Error("User no longer exists");
    }

    // 4. Naye tokens generate karo
    const newTokens = generateTokens({
      id: user.id,
      email: user.email,
      role_name: user.role_name,
    });

    // 5. Token Rotation: Purana token DB se delete karo, aur naya insert karo
    await repository.deleteRefreshToken(incomingRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 din ki nayi expiry
    await repository.saveRefreshToken(
      user.id,
      newTokens.refreshToken,
      expiresAt,
    );

    // Naye tokens wapas bhejo
    return newTokens;
  }

  async googleLogin(googleData: {
    idToken: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  }) {
    const repository = new authRepository();

    // 1. Google Token Verify Karo (Identity check)
    const ticket = await googleClient.verifyIdToken({
      idToken: googleData.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Safety check
    if (!payload || !payload.email || !payload.sub) {
      throw new Error("Invalid Google Token: Missing essential payload data");
    }

    const { sub: googleId, email, name: full_name, picture } = payload;

    if (!email) throw new Error("Email not found in Google account");

    // 2. Check karo DB mein user pehle se hai ya nahi
    let user = await repository.findUserByEmail(email);

    // --- YAHAN LAGANA HAI YE LOGIC ---
    if (user) {
      // Agar existing user ki photo null hai ya badal gayi hai, toh update karo
      if (!user.avatar_url && picture) {
        // Ensure repository mein 'updateUserAvatar' function bana hua hai
        user = await repository.updateUserAvatar(user.id, picture);
      }
    } else {
      // 3. Agar naya user hai, toh DB mein entry banao (PEHLE WALA LOGIC)
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const newUserData = {
        fullName: full_name || "Google User",
        email: email,
        password: hashedPassword,
        avatar_url: picture || null,
      };

      user = await repository.registerUser(newUserData);
    }
    // ---------------------------------

    // 4. Time Conversion
    let finalExpiresAt = null;
    if (googleData.expiresIn) {
      finalExpiresAt = new Date(Date.now() + googleData.expiresIn * 1000);
    }

    // 5. Accounts Table mein entry daalo
    await repository.linkProviderAccount({
      user_id: user.id,
      provider: "google",
      provider_account_id: googleId,
      access_token: googleData.accessToken || null,
      refresh_token: googleData.refreshToken || null,
      expires_at: finalExpiresAt,
    });

    // 6. Custom JWT Tokens Generate Karo
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role_name: user.role_name,
    });

    // 7. Refresh token save karo
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
    await repository.saveRefreshToken(
      user.id,
      tokens.refreshToken,
      sessionExpiresAt,
    );

    // 8. Security: Response mapping
    return {
      user: {
        id: user.id,
        full_name: user.fullName || user.full_name,
        email: user.email,
        picture: user.avatar_url, // 'avatar_url' ko 'picture' naam se bhej rahe hain
      },
      ...tokens,
    };
  }

  // auth.service.ts mein add karo
  async getUserProfile(userId: string) {
    const repository = new authRepository();
    return await repository.findUserById(userId);
  }

  // NEW: Forgot Password - Send OTP
  async forgotPassword(email: string) {
    const repository = new authRepository();
    const user = await repository.findUserByEmail(email);
    if (!user) throw new Error("User not found"); // Handled securely in controller

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await repository.saveOtp(email, otp, "RESET", expiresAt);

    // TODO: Yahan apna Email bhejne ka logic lagana
    // OTP DB mein save karne ke baad:
    await repository.saveOtp(email, otp, "RESET", expiresAt);

    // Naya Email bhejne ka logic
    const { subject, text, html } = getPasswordResetOtpTemplate(otp);

    await sendEmail(email, subject, text, html);
  }

  // NEW: Verify Reset OTP & Give Temporary Token
  // UPDATED: Verify Reset OTP & Give Temporary Token
  async verifyResetOtp(email: string, otp: string) {
    const repository = new authRepository();

    const isValid = await repository.verifyAndDeleteOtp(email, otp, "RESET");
    if (!isValid) throw new Error("Invalid or Expired OTP");

    const user = await repository.findUserByEmail(email);
    if (!user) throw new Error("User not found");

    // 🚀 Naya Helper function use kiya hai yahan
    const resetToken = generateResetToken(user.id);

    return resetToken;
  }

  // UPDATED: Update Password
  async resetPassword(resetToken: string, newPassword: string) {
    const repository = new authRepository();

    // 🚀 Naya Helper function use kiya hai, error aayega toh wahi catch ho jayega
    const decoded = verifyResetToken(resetToken);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // decoded.id hume naye verifyResetToken function se mil jayegi
    await repository.updatePassword(decoded.id, hashedPassword);
  }

  // NEW: Enable MFA
  async generateMfaSecret(userId: string, email: string) {
    const repository = new authRepository();

    const secret = generateSecret();
    const otpauth = generateURI({ label: email, issuer: "SmashFIT", secret });

    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    // Save secret to database and enable MFA
    await repository.updateMfaSecret(userId, secret, true);

    return {
      secret,
      qrCodeUrl,
    };
  }
}

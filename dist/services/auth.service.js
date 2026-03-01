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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const auth_repository_1 = require("../repositories/auth.repository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const email_util_1 = require("../utils/email.util");
const email_templates_util_1 = require("../utils/email-templates.util");
const jwt_utils_1 = require("../utils/jwt.utils");
const google_auth_library_1 = require("google-auth-library");
const otplib_1 = require("otplib");
const qrcode_1 = __importDefault(require("qrcode"));
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
class authService {
    // Helper method to generate OTP
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    }
    registerUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            // 1. Business Logic: Check if user already exists
            // Email se check kar rahe hain taaki duplicate accounts na banein
            const existingUser = yield repository.findUserByEmail(userData.email);
            if (existingUser) {
                throw new Error("User already registered with this email");
            }
            // 2. Business Logic: Password Hashing
            // Plain text password ko secure hash mein convert karna
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(userData.password, salt);
            // 3. Save to Pending OTPs table instead of Users table
            const otp = this.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
            const pendingUserData = {
                fullName: userData.fullName,
                email: userData.email,
                password: hashedPassword,
            };
            yield repository.saveOtp(userData.email, otp, "ACTIVATION", expiresAt, pendingUserData);
            // 4. Send Email
            // build a token the frontend or user can POST back to /api/auth/verify-email
            const token = Buffer.from(`${userData.email}:${otp}`).toString("base64");
            const { subject, text, html } = (0, email_templates_util_1.getRegistrationOtpTemplate)(otp, token);
            yield (0, email_util_1.sendEmail)(userData.email, subject, text, html);
            return {
                message: "Account pending. OTP sent to your email to verify registration.",
            };
        });
    }
    // --- NEW: Verify OTP and Finalize Registration ---
    verifyRegistrationOtp(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            // 1. Verify OTP aur metadata nikaalo
            const verification = yield repository.verifyAndDeleteOtp(email, otp, "ACTIVATION");
            if (!verification.isValid) {
                throw new Error("Invalid or expired OTP");
            }
            // 2. Original registration payload recover karo
            const pendingUserData = verification.metadata;
            if (!pendingUserData) {
                throw new Error("Pending user data not found or corrupted.");
            }
            // 3. Database mein user create karo!
            const savedUser = yield repository.registerUser(pendingUserData);
            // 4. Return tokens (jaise login mein karte hain) automatically login karne ke liye
            const tokens = (0, jwt_utils_1.generateTokens)({
                id: savedUser.id,
                email: savedUser.email,
                role_name: savedUser.role_name,
            });
            const sessionExpiresAt = new Date();
            sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
            yield repository.saveRefreshToken(savedUser.id, tokens.refreshToken, sessionExpiresAt);
            // 5. Send Welcome Email
            const userName = savedUser.full_name || savedUser.fullName || "User";
            const { subject, text, html } = (0, email_templates_util_1.getWelcomeEmailTemplate)(userName);
            // We can send this asynchronously so it doesn't block the login response speed
            (0, email_util_1.sendEmail)(savedUser.email, subject, text, html).catch(console.error);
            // Password hata do response se
            const { password } = savedUser, userWithoutPassword = __rest(savedUser, ["password"]);
            return Object.assign({ user: userWithoutPassword }, tokens);
        });
    }
    loginUser(loginData) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            const user = yield repository.findUserByEmail(loginData.email);
            if (!user)
                throw new Error("Invalid email or password");
            const isPasswordMatch = yield bcrypt_1.default.compare(loginData.password, user.password);
            if (!isPasswordMatch)
                throw new Error("Invalid email or password");
            // Since login doesn't need an OTP anymore, we issue JWTs immediately
            const tokens = (0, jwt_utils_1.generateTokens)({
                id: user.id,
                email: user.email,
                role_name: user.role_name,
            });
            // Refresh token ko DB mein save karo (session management)
            const sessionExpiresAt = new Date();
            sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
            yield repository.saveRefreshToken(user.id, tokens.refreshToken, sessionExpiresAt);
            return Object.assign({ user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    role: user.role_name,
                } }, tokens);
        });
    }
    logoutUser(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!refreshToken) {
                return; // Agar token hai hi nahi, toh aage badhne ki zaroorat nahi
            }
            const repository = new auth_repository_1.authRepository();
            yield repository.deleteRefreshToken(refreshToken);
        });
    }
    refreshAccessToken(incomingRefreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            // 1. Cryptographically verify karo (jwt.util se)
            let decoded;
            try {
                decoded = (0, jwt_utils_1.verifyToken)(incomingRefreshToken, true); // true matlab ye refresh token hai
            }
            catch (error) {
                throw new Error("Invalid or Expired Refresh Token");
            }
            // 2. Database mein check karo (kahi token blacklist toh nahi ho gaya?)
            const tokenInDb = yield repository.findRefreshToken(incomingRefreshToken);
            if (!tokenInDb) {
                throw new Error("Refresh Token not found or revoked");
            }
            // 3. User exist karta hai ya nahi check karo (Safety check)
            // Note: TypeScript error se bachne ke liye 'decoded as any' ya properly type kar lena
            const user = yield repository.findUserById(decoded.id);
            if (!user) {
                throw new Error("User no longer exists");
            }
            // 4. Naye tokens generate karo
            const newTokens = (0, jwt_utils_1.generateTokens)({
                id: user.id,
                email: user.email,
                role_name: user.role_name,
            });
            // 5. Token Rotation: Purana token DB se delete karo, aur naya insert karo
            yield repository.deleteRefreshToken(incomingRefreshToken);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 din ki nayi expiry
            yield repository.saveRefreshToken(user.id, newTokens.refreshToken, expiresAt);
            // Naye tokens wapas bhejo
            return newTokens;
        });
    }
    googleLogin(googleData) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            // 1. Google Token Verify Karo (Identity check)
            const ticket = yield googleClient.verifyIdToken({
                idToken: googleData.idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            // Safety check
            if (!payload || !payload.email || !payload.sub) {
                throw new Error("Invalid Google Token: Missing essential payload data");
            }
            const { sub: googleId, email, name: full_name, picture } = payload;
            if (!email)
                throw new Error("Email not found in Google account");
            // 2. Check karo DB mein user pehle se hai ya nahi
            let user = yield repository.findUserByEmail(email);
            // --- YAHAN LAGANA HAI YE LOGIC ---
            if (user) {
                // Agar existing user ki photo null hai ya badal gayi hai, toh update karo
                if (!user.avatar_url && picture) {
                    // Ensure repository mein 'updateUserAvatar' function bana hua hai
                    user = yield repository.updateUserAvatar(user.id, picture);
                }
            }
            else {
                // 3. Agar naya user hai, toh DB mein entry banao (PEHLE WALA LOGIC)
                const randomPassword = crypto_1.default.randomBytes(16).toString("hex");
                const salt = yield bcrypt_1.default.genSalt(10);
                const hashedPassword = yield bcrypt_1.default.hash(randomPassword, salt);
                const newUserData = {
                    fullName: full_name || "Google User",
                    email: email,
                    password: hashedPassword,
                    avatar_url: picture || null,
                };
                user = yield repository.registerUser(newUserData);
            }
            // ---------------------------------
            // 4. Time Conversion
            let finalExpiresAt = null;
            if (googleData.expiresIn) {
                finalExpiresAt = new Date(Date.now() + googleData.expiresIn * 1000);
            }
            // 5. Accounts Table mein entry daalo
            yield repository.linkProviderAccount({
                user_id: user.id,
                provider: "google",
                provider_account_id: googleId,
                access_token: googleData.accessToken || null,
                refresh_token: googleData.refreshToken || null,
                expires_at: finalExpiresAt,
            });
            // 6. Custom JWT Tokens Generate Karo
            const tokens = (0, jwt_utils_1.generateTokens)({
                id: user.id,
                email: user.email,
                role_name: user.role_name,
            });
            // 7. Refresh token save karo
            const sessionExpiresAt = new Date();
            sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
            yield repository.saveRefreshToken(user.id, tokens.refreshToken, sessionExpiresAt);
            // 8. Security: Response mapping
            return Object.assign({ user: {
                    id: user.id,
                    full_name: user.fullName || user.full_name,
                    email: user.email,
                    picture: user.avatar_url, // 'avatar_url' ko 'picture' naam se bhej rahe hain
                } }, tokens);
        });
    }
    // auth.service.ts mein add karo
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            return yield repository.findUserById(userId);
        });
    }
    // NEW: Forgot Password - Send OTP
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            const user = yield repository.findUserByEmail(email);
            if (!user)
                throw new Error("User not found"); // Handled securely in controller
            const otp = this.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            yield repository.saveOtp(email, otp, "RESET", expiresAt);
            // TODO: Yahan apna Email bhejne ka logic lagana
            // OTP DB mein save karne ke baad:
            yield repository.saveOtp(email, otp, "RESET", expiresAt);
            // Naya Email bhejne ka logic
            const { subject, text, html } = (0, email_templates_util_1.getPasswordResetOtpTemplate)(otp);
            yield (0, email_util_1.sendEmail)(email, subject, text, html);
        });
    }
    // NEW: Verify Reset OTP & Give Temporary Token
    // UPDATED: Verify Reset OTP & Give Temporary Token
    verifyResetOtp(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            const isValid = yield repository.verifyAndDeleteOtp(email, otp, "RESET");
            if (!isValid)
                throw new Error("Invalid or Expired OTP");
            const user = yield repository.findUserByEmail(email);
            if (!user)
                throw new Error("User not found");
            // 🚀 Naya Helper function use kiya hai yahan
            const resetToken = (0, jwt_utils_1.generateResetToken)(user.id);
            return resetToken;
        });
    }
    // UPDATED: Update Password
    resetPassword(resetToken, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            // 🚀 Naya Helper function use kiya hai, error aayega toh wahi catch ho jayega
            const decoded = (0, jwt_utils_1.verifyResetToken)(resetToken);
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, salt);
            // decoded.id hume naye verifyResetToken function se mil jayegi
            yield repository.updatePassword(decoded.id, hashedPassword);
        });
    }
    // NEW: Enable MFA
    generateMfaSecret(userId, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            const secret = (0, otplib_1.generateSecret)();
            const otpauth = (0, otplib_1.generateURI)({ label: email, issuer: "SmashFIT", secret });
            const qrCodeUrl = yield qrcode_1.default.toDataURL(otpauth);
            // Save secret to database and enable MFA
            yield repository.updateMfaSecret(userId, secret, true);
            return {
                secret,
                qrCodeUrl,
            };
        });
    }
    // ==================== NEW: LOGIN OTP METHODS ====================
    // Step 1: Generate OTP after password verification (called from modified loginUser)
    initiateLoginOtp(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            const user = yield repository.findUserByEmail(email);
            if (!user)
                throw new Error("Invalid email or password");
            const isPasswordMatch = yield bcrypt_1.default.compare(password, user.password);
            if (!isPasswordMatch)
                throw new Error("Invalid email or password");
            // Generate OTP
            const otp = this.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            // Store user data in OTP metadata for later use
            const loginMetadata = {
                userId: user.id,
                email: user.email,
                role_name: user.role_name,
                full_name: user.full_name,
            };
            yield repository.saveOtp(email, otp, "LOGIN", expiresAt, loginMetadata);
            // Send OTP email
            const { subject, text, html } = (0, email_templates_util_1.getRegistrationOtpTemplate)(otp, "");
            yield (0, email_util_1.sendEmail)(email, subject, text, html);
            return {
                message: "OTP sent to your email. Please verify to complete login.",
                email: email, // Frontend ko email bhej rahe hain taakih woh OTP page mein use kar sake
            };
        });
    }
    // Step 2: Verify Login OTP and return tokens
    verifyLoginOtp(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            const verification = yield repository.verifyAndDeleteOtp(email, otp, "LOGIN");
            if (!verification.isValid) {
                throw new Error("Invalid or expired OTP");
            }
            const loginMetadata = verification.metadata;
            if (!loginMetadata || !loginMetadata.userId) {
                throw new Error("Login data not found or corrupted.");
            }
            // Generate tokens
            const tokens = (0, jwt_utils_1.generateTokens)({
                id: loginMetadata.userId,
                email: loginMetadata.email,
                role_name: loginMetadata.role_name,
            });
            // Save refresh token
            const sessionExpiresAt = new Date();
            sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
            yield repository.saveRefreshToken(loginMetadata.userId, tokens.refreshToken, sessionExpiresAt);
            return Object.assign({ user: {
                    id: loginMetadata.userId,
                    fullName: loginMetadata.full_name,
                    email: loginMetadata.email,
                    role: loginMetadata.role_name,
                } }, tokens);
        });
    }
    // ==================== NEW: OAUTH OTP METHODS ====================
    // NEW: Initiate OAuth OTP from Google Token
    initiateOAuthOtpFromGoogle(googleData) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            // 1. Verify Google Token
            const ticket = yield googleClient.verifyIdToken({
                idToken: googleData.idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email || !payload.sub) {
                throw new Error("Invalid Google Token: Missing essential payload data");
            }
            const { sub: googleId, email, name: full_name, picture } = payload;
            if (!email)
                throw new Error("Email not found in Google account");
            // 2. Initiate OTP (this handles both new and existing users)
            return yield this.initiateOAuthOtp(googleId, email, full_name || "Google User", picture);
        });
    }
    // Step 1: After successful OAuth verification, generate OTP
    initiateOAuthOtp(googleId, email, fullName, picture) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            // Check if user exists
            let user = yield repository.findUserByEmail(email);
            if (user) {
                // Existing user - update avatar if needed
                if (!user.avatar_url && picture) {
                    user = yield repository.updateUserAvatar(user.id, picture);
                }
            }
            else {
                // New user - create account after OTP verification
                // Don't create user yet, store data in OTP metadata
            }
            // Generate OTP
            const otp = this.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            // Store OAuth data in OTP metadata
            const oauthMetadata = {
                googleId,
                email,
                fullName,
                picture: picture || null,
                isNewUser: !user, // Flag to indicate if user needs to be created
                existingUserId: (user === null || user === void 0 ? void 0 : user.id) || null,
            };
            yield repository.saveOtp(email, otp, "OAUTH", expiresAt, oauthMetadata);
            // Send OTP email
            const { subject, text, html } = (0, email_templates_util_1.getRegistrationOtpTemplate)(otp, "");
            yield (0, email_util_1.sendEmail)(email, subject, text, html);
            return {
                message: "OTP sent to your email. Please verify to complete OAuth login.",
                email: email,
            };
        });
    }
    // Step 2: Verify OAuth OTP and complete account creation/login
    verifyOAuthOtp(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new auth_repository_1.authRepository();
            const verification = yield repository.verifyAndDeleteOtp(email, otp, "OAUTH");
            if (!verification.isValid) {
                throw new Error("Invalid or expired OTP");
            }
            const oauthMetadata = verification.metadata;
            if (!oauthMetadata) {
                throw new Error("OAuth data not found or corrupted.");
            }
            let user;
            if (oauthMetadata.isNewUser) {
                // Create new user account
                const randomPassword = crypto_1.default.randomBytes(16).toString("hex");
                const salt = yield bcrypt_1.default.genSalt(10);
                const hashedPassword = yield bcrypt_1.default.hash(randomPassword, salt);
                const newUserData = {
                    fullName: oauthMetadata.fullName,
                    email: oauthMetadata.email,
                    password: hashedPassword,
                    avatar_url: oauthMetadata.picture,
                };
                user = yield repository.registerUser(newUserData);
            }
            else {
                // Existing user
                user = yield repository.findUserById(oauthMetadata.existingUserId);
                if (!user) {
                    throw new Error("User not found");
                }
            }
            // Link provider account
            const finalExpiresAt = null; // Google token expiry can be handled separately
            yield repository.linkProviderAccount({
                user_id: user.id,
                provider: "google",
                provider_account_id: oauthMetadata.googleId,
                access_token: null,
                refresh_token: null,
                expires_at: finalExpiresAt,
            });
            // Generate tokens
            const tokens = (0, jwt_utils_1.generateTokens)({
                id: user.id,
                email: user.email,
                role_name: user.role_name,
            });
            // Save refresh token
            const sessionExpiresAt = new Date();
            sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
            yield repository.saveRefreshToken(user.id, tokens.refreshToken, sessionExpiresAt);
            // Send welcome email async
            const userName = user.full_name || user.fullName || "User";
            const { subject, text, html } = (0, email_templates_util_1.getWelcomeEmailTemplate)(userName);
            (0, email_util_1.sendEmail)(user.email, subject, text, html).catch(console.error);
            const { password } = user, userWithoutPassword = __rest(user, ["password"]);
            return Object.assign({ user: userWithoutPassword }, tokens);
        });
    }
}
exports.authService = authService;

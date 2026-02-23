import { UserRequest } from "../models/comman.model";
import { authRepository } from "../repositories/auth.repository";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateTokens, verifyToken } from "../utils/jwt.utils";
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class authService {

    async registerUser(userData: UserRequest) {
        const repository = new authRepository();

        // 1. Business Logic: Check if user already exists
        // Email se check kar rahe hain taaki duplicate accounts na banein
        const existingUser = await repository.findUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already registered with this email');
        }

        // 2. Business Logic: Password Hashing
        // Plain text password ko secure hash mein convert karna
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // 3. Data Prepare & Save
        // Original userData ke saath hashed password ko merge kar rahe hain
        const finalUserData = {
            ...userData,
            password: hashedPassword
        };

        const savedUser = await repository.registerUser(finalUserData);
        
        // 4. Return formatted data (Password hide karke)
        const { password, ...userWithoutPassword } = savedUser; 

        return userWithoutPassword;
    }

    async loginUser(loginData: any) {
        const repository = new authRepository();
        
        // 1. User find & Password check...
        const user = await repository.findUserByEmail(loginData.email);
        if (!user) throw new Error('Invalid email or password');
        
        const isPasswordMatch = await bcrypt.compare(loginData.password, user.password);
        if (!isPasswordMatch) throw new Error('Invalid email or password');

        // 2. Tokens generate karo
        const tokens = generateTokens({ id: user.id, email: user.email });

        // 3. DATABASE MEIN INSERT KARO (Naya step)
        // Expiry date calculate karo (e.g., 7 days aage ki date)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Token ko DB mein save karo user_id ke sath
        await repository.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

        // 4. Return Data
        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            ...tokens
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
        const newTokens = generateTokens({ id: user.id, email: user.email });

        // 5. Token Rotation: Purana token DB se delete karo, aur naya insert karo
        await repository.deleteRefreshToken(incomingRefreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 din ki nayi expiry
        await repository.saveRefreshToken(user.id, newTokens.refreshToken, expiresAt);

        // Naye tokens wapas bhejo
        return newTokens;
    }

async googleLogin(googleData: { idToken: string, accessToken?: string, refreshToken?: string, expiresIn?: number }) {
    const repository = new authRepository();

    // 1. Google Token Verify Karo (Identity check)
    const ticket = await googleClient.verifyIdToken({
        idToken: googleData.idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Safety check: Essential fields missing nahi honi chahiye
    if (!payload || !payload.email || !payload.sub) {
        throw new Error('Invalid Google Token: Missing essential payload data');
    }

    const { email, name, picture, sub } = payload;

    // 2. Check karo DB mein user pehle se hai ya nahi
    let user = await repository.findUserByEmail(email);

    // 3. Agar naya user hai, toh DB mein entry banao
    if (!user) {
        // Secure random password generate karo (DB NOT NULL constraint ke liye)
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        const newUserData = {
            full_name: name || 'Google User',
            email: email,
            password: hashedPassword,
            avatar_url: picture || null // Google profile pic
        };

        user = await repository.registerUser(newUserData);
    }

    // 4. Time Conversion: Google's relative 'expiresIn' (seconds) -> Absolute Date
    let finalExpiresAt = null;
    if (googleData.expiresIn) {
        // Current time + seconds to milliseconds
        finalExpiresAt = new Date(Date.now() + (googleData.expiresIn * 1000));
    }

    // 5. Accounts Table mein entry daalo (Linking Google to User)
    // Isse tum user ke Google features (Calendar etc.) baad mein access kar paoge
    await repository.linkProviderAccount({
        user_id: user.id,
        provider: 'google',
        provider_account_id: sub, // Google's unique ID
        access_token: googleData.accessToken || null,
        refresh_token: googleData.refreshToken || null,
        expires_at: finalExpiresAt
    });

    // 6. Custom JWT Tokens Generate Karo (Tumhare App ke session ke liye)
    const tokens = generateTokens({ id: user.id, email: user.email });

    // 7. Refresh token ko session table (sm.refresh_tokens) mein save karo
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7); // 7 din ka session
    await repository.saveRefreshToken(user.id, tokens.refreshToken, sessionExpiresAt);

    // 8. Security: Password hata kar user details aur tokens bhej do
    const { password, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        ...tokens
    };
}

}
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
        // Tokens generate karte waqt:
    const tokens = generateTokens({ 
        id: user.id, 
        email: user.email, 
        role_name: user.role_name // Ye DB join se aayega
    });

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
        const newTokens = generateTokens({ id: user.id, email: user.email, role_name: user.role_name });

        // 5. Token Rotation: Purana token DB se delete karo, aur naya insert karo
        await repository.deleteRefreshToken(incomingRefreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 din ki nayi expiry
        await repository.saveRefreshToken(user.id, newTokens.refreshToken, expiresAt);

        // Naye tokens wapas bhejo
        return newTokens;
    }

    async googleLogin(googleData: { idToken: string, accessToken?: string, refreshToken?: string, expiresIn?: number }) {
        // console.log("start of service");
        const repository = new authRepository();

        // 1. Google Token Verify Karo (Identity check)
        const ticket = await googleClient.verifyIdToken({
            idToken: googleData.idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Safety check
        if (!payload || !payload.email || !payload.sub) {
            throw new Error('Invalid Google Token: Missing essential payload data');
        }

        const { 
            sub: googleId, 
            email, 
            name: full_name, 
            picture 
        } = payload;

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
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            const newUserData = {
                fullName: full_name || 'Google User',
                email: email,
                password: hashedPassword,
                avatar_url: picture || null
            };

            user = await repository.registerUser(newUserData);
        }
        // ---------------------------------

        // 4. Time Conversion
        let finalExpiresAt = null;
        if (googleData.expiresIn) {
            finalExpiresAt = new Date(Date.now() + (googleData.expiresIn * 1000));
        }

        // 5. Accounts Table mein entry daalo
        await repository.linkProviderAccount({
            user_id: user.id,
            provider: 'google',
            provider_account_id: googleId,
            access_token: googleData.accessToken || null,
            refresh_token: googleData.refreshToken || null,
            expires_at: finalExpiresAt
        });

        // 6. Custom JWT Tokens Generate Karo
        const tokens = generateTokens({ id: user.id, email: user.email, role_name: user.role_name });

        // 7. Refresh token save karo
        const sessionExpiresAt = new Date();
        sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
        await repository.saveRefreshToken(user.id, tokens.refreshToken, sessionExpiresAt);

        // console.log("end of service");
        // 8. Security: Response mapping
        return {
            user: {
                id: user.id,
                full_name: user.fullName || user.full_name, 
                email: user.email,
                picture: user.avatar_url, // 'avatar_url' ko 'picture' naam se bhej rahe hain
            },
            ...tokens
        };
    }

    // auth.service.ts mein add karo
    async getUserProfile(userId: string) {
        const repository = new authRepository();
        return await repository.findUserById(userId);
    }

}
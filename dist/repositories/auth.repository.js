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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = void 0;
const db_1 = __importDefault(require("../config/db")); // Tumhara DB connection pool
class authRepository {
    // Login ke liye: User ko email se dhoondhna
    // 1. Find User by Email (JOIN ke sath)
    findUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            SELECT u.*, r.role_name 
            FROM sm.users u 
            LEFT JOIN sm.roles r ON u.role_id = r.id 
            WHERE u.email = $1
        `;
            const result = yield db_1.default.query(query, [email]);
            return result.rows[0];
        });
    }
    updateUserAvatar(userId, avatarUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = "UPDATE sm.users SET avatar_url = $1 WHERE id = $2 RETURNING id, full_name, email, avatar_url";
            const result = yield db_1.default.query(query, [avatarUrl, userId]);
            return result.rows[0];
        });
    }
    // Register ke liye (Jo pehle banaya tha)
    registerUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // First, get the default USER role
            const roleQuery = `SELECT id FROM sm.roles WHERE role_name = 'USER' LIMIT 1`;
            const roleResult = yield db_1.default.query(roleQuery);
            const roleId = (_a = roleResult.rows[0]) === null || _a === void 0 ? void 0 : _a.id;
            const query = `
            WITH inserted AS (
                INSERT INTO sm.users (full_name, email, password, avatar_url, role_id) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING *
            )
            SELECT i.*, r.role_name 
            FROM inserted i
            LEFT JOIN sm.roles r ON i.role_id = r.id
        `;
            const values = [
                userData.fullName,
                userData.email,
                userData.password,
                userData.avatar_url || null,
                roleId,
            ];
            const result = yield db_1.default.query(query, values);
            return result.rows[0];
        });
    }
    saveRefreshToken(userId, token, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            INSERT INTO sm.refresh_tokens (user_id, token, expires_at) 
            VALUES ($1, $2, $3) 
            ON CONFLICT (token) 
            DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
            RETURNING id, token;
        `;
            const values = [userId, token, expiresAt];
            const result = yield db_1.default.query(query, values);
            return result.rows[0];
        });
    }
    deleteRefreshToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            // Token match karke use table se hata do
            const query = "DELETE FROM sm.refresh_tokens WHERE token = $1";
            yield db_1.default.query(query, [token]);
        });
    }
    // 1. DB mein check karna ki token exist karta hai ya nahi
    findRefreshToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = "SELECT * FROM sm.refresh_tokens WHERE token = $1";
            const result = yield db_1.default.query(query, [token]);
            return result.rows[0];
        });
    }
    // 2. Naya token banane ke liye user ki details chahiye hongi
    // 2. Find User by ID (JOIN ke sath)
    findUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            SELECT u.*, r.role_name 
            FROM sm.users u 
            LEFT JOIN sm.roles r ON u.role_id = r.id 
            WHERE u.id = $1
        `;
            const result = yield db_1.default.query(query, [id]);
            return result.rows[0];
        });
    }
    linkProviderAccount(accountData) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            INSERT INTO sm.accounts 
            (user_id, provider, provider_account_id, access_token, refresh_token, expires_at) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (provider, provider_account_id) 
            DO UPDATE SET 
                access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                expires_at = EXCLUDED.expires_at
            RETURNING id;
        `;
            const values = [
                accountData.user_id,
                accountData.provider,
                accountData.provider_account_id,
                accountData.access_token,
                accountData.refresh_token,
                accountData.expires_at,
            ];
            const result = yield db_1.default.query(query, values);
            return result.rows[0];
        });
    }
    // Helper method to get default USER role ID
    getDefaultRoleId() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const query = `SELECT id FROM sm.roles WHERE role_name = 'USER' LIMIT 1`;
            const result = yield db_1.default.query(query);
            return ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.id) || null;
        });
    }
    // auth.repository.ts (Add these methods inside authRepository class)
    // Save OTP to DB with optional metadata
    saveOtp(email, otp, type, expiresAt, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            // Pehle purane OTP uda do same type ke, taaki spam na ho
            yield db_1.default.query('DELETE FROM sm.otps WHERE email = $1 AND type = $2', [email, type]);
            const query = `
            INSERT INTO sm.otps (email, otp, type, expires_at, metadata) 
            VALUES ($1, $2, $3, $4, $5)
        `;
            yield db_1.default.query(query, [email, otp, type, expiresAt, metadata ? JSON.stringify(metadata) : null]);
        });
    }
    // Verify and Delete OTP (One-time use)
    // Verify and Delete OTP (One-time use) with Metadata Return
    verifyAndDeleteOtp(email, otp, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            SELECT * FROM sm.otps 
            WHERE email = $1 AND otp = $2 AND type = $3 AND expires_at > NOW()
        `;
            const result = yield db_1.default.query(query, [email, otp, type]);
            if (result.rows.length > 0) {
                // OTP sahi hai, ab isko delete kar do taaki dobara use na ho
                const row = result.rows[0];
                yield db_1.default.query('DELETE FROM sm.otps WHERE id = $1', [row.id]);
                return { isValid: true, metadata: row.metadata };
            }
            return { isValid: false };
        });
    }
    // Update Password
    updatePassword(userId, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = "UPDATE sm.users SET password = $1 WHERE id = $2";
            yield db_1.default.query(query, [hashedPassword, userId]);
        });
    }
    // NEW: Email Verification
    updateEmailVerificationStatus(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = "UPDATE sm.users SET is_email_verified = true WHERE id = $1";
            yield db_1.default.query(query, [userId]);
        });
    }
    // NEW: MFA Setup
    updateMfaSecret(userId, secret, enabled) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = "UPDATE sm.users SET mfa_secret = $1, mfa_enabled = $2 WHERE id = $3";
            yield db_1.default.query(query, [secret, enabled, userId]);
        });
    }
}
exports.authRepository = authRepository;

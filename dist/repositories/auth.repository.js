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
            const query = 'UPDATE sm.users SET avatar_url = $1 WHERE id = $2 RETURNING id, full_name, email, avatar_url';
            const result = yield db_1.default.query(query, [avatarUrl, userId]);
            return result.rows[0];
        });
    }
    // Register ke liye (Jo pehle banaya tha)
    registerUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
            WITH inserted AS (
                INSERT INTO sm.users (full_name, email, password, avatar_url) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
            )
            SELECT i.*, r.role_name 
            FROM inserted i
            LEFT JOIN sm.roles r ON i.role_id = r.id
        `;
            const values = [userData.fullName, userData.email, userData.password, userData.avatar_url || null];
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
            const query = 'DELETE FROM sm.refresh_tokens WHERE token = $1';
            yield db_1.default.query(query, [token]);
        });
    }
    // 1. DB mein check karna ki token exist karta hai ya nahi
    findRefreshToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = 'SELECT * FROM sm.refresh_tokens WHERE token = $1';
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
                accountData.expires_at
            ];
            const result = yield db_1.default.query(query, values);
            return result.rows[0];
        });
    }
}
exports.authRepository = authRepository;

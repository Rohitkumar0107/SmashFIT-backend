import pool from "../config/db"; // Tumhara DB connection pool
import { AccountData, UserRequest } from "../models/comman.model";

export class authRepository {
    
    // Login ke liye: User ko email se dhoondhna
    // 1. Find User by Email (JOIN ke sath)
    async findUserByEmail(email: string) {
        const query = `
            SELECT u.*, r.role_name 
            FROM sm.users u 
            LEFT JOIN sm.roles r ON u.role_id = r.id 
            WHERE u.email = $1
        `;
        const result = await pool.query(query, [email]);
        return result.rows[0]; 
    }

    async updateUserAvatar(userId: string, avatarUrl: string) {
        const query = 'UPDATE sm.users SET avatar_url = $1 WHERE id = $2 RETURNING id, full_name, email, avatar_url';
        const result = await pool.query(query, [avatarUrl, userId]);
        return result.rows[0];
    }

    // Register ke liye (Jo pehle banaya tha)
    async registerUser(userData: UserRequest) {
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
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
        const query = `
            INSERT INTO sm.refresh_tokens (user_id, token, expires_at) 
            VALUES ($1, $2, $3) 
            ON CONFLICT (token) 
            DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
            RETURNING id, token;
        `;
        const values = [userId, token, expiresAt];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async deleteRefreshToken(token: string) {
        // Token match karke use table se hata do
        const query = 'DELETE FROM sm.refresh_tokens WHERE token = $1';
        await pool.query(query, [token]);
    }

    // 1. DB mein check karna ki token exist karta hai ya nahi
    async findRefreshToken(token: string) {
        const query = 'SELECT * FROM sm.refresh_tokens WHERE token = $1';
        const result = await pool.query(query, [token]);
        return result.rows[0];
    }

    // 2. Naya token banane ke liye user ki details chahiye hongi
    // 2. Find User by ID (JOIN ke sath)
    async findUserById(id: string) {
        const query = `
            SELECT u.*, r.role_name 
            FROM sm.users u 
            LEFT JOIN sm.roles r ON u.role_id = r.id 
            WHERE u.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    async linkProviderAccount(accountData: AccountData) {
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

        const result = await pool.query(query, values);
        return result.rows[0];
    }
}
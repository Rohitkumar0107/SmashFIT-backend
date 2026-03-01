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
const db_1 = __importDefault(require("../config/db"));
/**
 * Creates the sm.notifications table if it doesn't already exist.
 * Run: npx ts-node src/scripts/create-notifications-table.ts
 */
const createNotificationsTable = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.default.connect();
    try {
        console.log('🔧 Creating sm.notifications table...');
        yield client.query(`
      CREATE TABLE IF NOT EXISTS sm.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES sm.users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
        // Index for fast user lookups
        yield client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
      ON sm.notifications(user_id);
    `);
        console.log('✅ sm.notifications table created successfully!');
        // Seed some demo notifications for testing
        const userResult = yield client.query(`SELECT id FROM sm.users LIMIT 1`);
        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            yield client.query(`
        INSERT INTO sm.notifications (user_id, title, body, type, is_read)
        VALUES 
          ($1, 'Welcome to SmashFIT!', 'Your account has been set up successfully. Start by joining a tournament.', 'info', false),
          ($1, 'Match Starting Soon', 'Your match on Court 3 begins in 15 minutes. Get ready!', 'match', false),
          ($1, 'Tournament Registration Open', 'Spring Smash 2026 registrations are now open. Register before slots fill up!', 'tournament', false),
          ($1, 'Payment Received', 'Your payment of ₹500 for Winter Open 2026 has been confirmed.', 'payment', true),
          ($1, 'Match Result', 'You won your Round 2 match 21-18, 21-15. Great performance!', 'match', true);
      `, [userId]);
            console.log(`📬 Seeded 5 demo notifications for user ${userId}`);
        }
    }
    catch (error) {
        console.error('❌ Failed to create notifications table:', error);
    }
    finally {
        client.release();
        yield db_1.default.end();
    }
});
createNotificationsTable();

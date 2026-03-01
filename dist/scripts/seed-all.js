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
 * Seeds ALL tables in the sm schema with realistic dummy data.
 * Run: npx ts-node src/scripts/seed-all.ts
 */
const seedAll = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.default.connect();
    try {
        console.log('🌱 Starting full database seed...\n');
        // ─── 0. Get existing user ───
        const existingUser = yield client.query(`SELECT id, email FROM sm.users LIMIT 1`);
        if (existingUser.rows.length === 0) {
            console.log('❌ No users found. Register at least one user first.');
            return;
        }
        const adminId = existingUser.rows[0].id;
        console.log(`👤 Admin: ${existingUser.rows[0].email} (${adminId})`);
        // ─── 1. Dummy Users ───
        console.log('\n📦 Creating dummy users...');
        const dummyUsers = [];
        const userNames = [
            { name: 'Aarav Sharma', email: 'aarav@smashfit.test' },
            { name: 'Priya Patel', email: 'priya@smashfit.test' },
            { name: 'Vikram Singh', email: 'vikram@smashfit.test' },
            { name: 'Neha Gupta', email: 'neha@smashfit.test' },
            { name: 'Rahul Verma', email: 'rahul@smashfit.test' },
        ];
        for (const u of userNames) {
            const exists = yield client.query(`SELECT id FROM sm.users WHERE email = $1`, [u.email]);
            if (exists.rows.length > 0) {
                dummyUsers.push(exists.rows[0].id);
            }
            else {
                const r = yield client.query(`INSERT INTO sm.users (full_name, email, password, is_email_verified, role_id)
           VALUES ($1, $2, '$2b$10$dummyhashforseeding000000000000000000000000000', true, 1)
           RETURNING id`, [u.name, u.email]);
                dummyUsers.push(r.rows[0].id);
            }
        }
        const allPlayerIds = [adminId, ...dummyUsers];
        console.log(`  ✅ ${dummyUsers.length} users ready`);
        // ─── 2. Players (sm.players) ───
        console.log('\n📦 Creating player profiles...');
        const playerStats = [
            { wins: 15, losses: 3, pts: 1500, streak: 5, tier: 'GOLD', played: 18, titles: 3 },
            { wins: 12, losses: 5, pts: 1200, streak: 3, tier: 'SILVER', played: 17, titles: 1 },
            { wins: 10, losses: 6, pts: 1050, streak: 2, tier: 'SILVER', played: 16, titles: 1 },
            { wins: 8, losses: 7, pts: 850, streak: 0, tier: 'BRONZE', played: 15, titles: 0 },
            { wins: 6, losses: 9, pts: 650, streak: -2, tier: 'BRONZE', played: 15, titles: 0 },
            { wins: 4, losses: 11, pts: 420, streak: -3, tier: 'UNRANKED', played: 15, titles: 0 },
        ];
        for (let i = 0; i < allPlayerIds.length; i++) {
            const s = playerStats[i] || playerStats[5];
            const wr = s.wins / (s.wins + s.losses);
            yield client.query(`INSERT INTO sm.players (user_id, total_points, global_rank, tier, win_rate, current_streak, wins, losses, matches_played, tournaments_played, titles_won)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (user_id) DO UPDATE SET total_points=$2, global_rank=$3, tier=$4, win_rate=$5, current_streak=$6, wins=$7, losses=$8, matches_played=$9, tournaments_played=$10, titles_won=$11`, [allPlayerIds[i], s.pts, i + 1, s.tier, wr, s.streak, s.wins, s.losses, s.played, 3, s.titles]);
        }
        console.log(`  ✅ ${allPlayerIds.length} players ready`);
        // ─── 3. Venues ───
        console.log('\n📦 Creating venues...');
        const venueIds = [];
        const venues = [
            { name: 'SmashFIT Arena', address: 'Sector 62, Noida', city: 'Noida', capacity: 8 },
            { name: 'Delhi Badminton Center', address: 'Dwarka Sector 21', city: 'New Delhi', capacity: 12 },
        ];
        for (const v of venues) {
            const exists = yield client.query(`SELECT id FROM sm.venues WHERE name = $1`, [v.name]);
            if (exists.rows.length > 0) {
                venueIds.push(exists.rows[0].id);
            }
            else {
                const r = yield client.query(`INSERT INTO sm.venues (name, address, city, capacity, surface_type, amenities, created_by)
           VALUES ($1, $2, $3, $4, 'Synthetic', '{"parking":true,"changing_rooms":true,"cafeteria":true}'::jsonb, $5)
           RETURNING id`, [v.name, v.address, v.city, v.capacity, adminId]);
                venueIds.push(r.rows[0].id);
            }
        }
        console.log(`  ✅ ${venueIds.length} venues ready`);
        // ─── 4. Organizations ───
        console.log('\n📦 Creating organizations...');
        const orgIds = [];
        const orgs = [
            { name: 'SmashFIT Club', slug: 'smashfit-club', desc: 'The premier badminton club.' },
            { name: 'Delhi Shuttlers', slug: 'delhi-shuttlers', desc: 'Community badminton group in Delhi NCR.' },
        ];
        for (const o of orgs) {
            const exists = yield client.query(`SELECT id FROM sm.organizations WHERE slug = $1`, [o.slug]);
            if (exists.rows.length > 0) {
                orgIds.push(exists.rows[0].id);
            }
            else {
                const r = yield client.query(`INSERT INTO sm.organizations (owner_id, name, slug, description)
           VALUES ($1, $2, $3, $4) RETURNING id`, [adminId, o.name, o.slug, o.desc]);
                orgIds.push(r.rows[0].id);
                yield client.query(`INSERT INTO sm.organization_members (organization_id, user_id, role) VALUES ($1, $2, 'OWNER') ON CONFLICT DO NOTHING`, [r.rows[0].id, adminId]);
            }
        }
        for (let i = 0; i < Math.min(3, dummyUsers.length); i++) {
            yield client.query(`INSERT INTO sm.organization_members (organization_id, user_id, role) VALUES ($1, $2, 'MEMBER') ON CONFLICT DO NOTHING`, [orgIds[0], dummyUsers[i]]);
        }
        console.log(`  ✅ ${orgIds.length} organizations ready`);
        // ─── 5. Tournaments (columns: organization_id, name, slug, sport, status, start_date, end_date, registration_open, registration_close, location, rules, max_participants, created_by) ───
        console.log('\n📦 Creating tournaments...');
        const tournamentIds = [];
        const tournaments = [
            { name: 'Winter Open 2026', slug: 'winter-open-2026', status: 'ACTIVE', location: 'SmashFIT Arena, Noida' },
            { name: 'Spring Smash 2026', slug: 'spring-smash-2026', status: 'DRAFT', location: 'SmashFIT Arena, Noida' },
            { name: 'Delhi Masters 2026', slug: 'delhi-masters-2026', status: 'COMPLETED', location: 'Delhi Badminton Center' },
        ];
        for (const t of tournaments) {
            const exists = yield client.query(`SELECT id FROM sm.tournaments WHERE slug = $1`, [t.slug]);
            if (exists.rows.length > 0) {
                tournamentIds.push(exists.rows[0].id);
            }
            else {
                const r = yield client.query(`INSERT INTO sm.tournaments (organization_id, name, slug, sport, status, start_date, end_date, registration_open, registration_close, location, max_participants, created_by)
           VALUES ($1, $2, $3, 'Badminton', $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 day', $5, 32, $6)
           RETURNING id`, [orgIds[0], t.name, t.slug, t.status, t.location, adminId]);
                tournamentIds.push(r.rows[0].id);
            }
        }
        console.log(`  ✅ ${tournamentIds.length} tournaments ready`);
        // ─── 6. Tournament Categories ───
        console.log('\n📦 Creating tournament categories...');
        for (const tid of tournamentIds) {
            const exists = yield client.query(`SELECT id FROM sm.tournament_categories WHERE tournament_id = $1 LIMIT 1`, [tid]);
            if (exists.rows.length === 0) {
                yield client.query(`INSERT INTO sm.tournament_categories (tournament_id, category_name, match_type, entry_fee, max_slots)
           VALUES ($1, 'Mens Singles', 'Singles', 500, 32),
                  ($1, 'Womens Singles', 'Singles', 500, 16),
                  ($1, 'Mens Doubles', 'Doubles', 600, 16)`, [tid]);
            }
        }
        console.log('  ✅ Categories added');
        // ─── 7. Tournament Participants ───
        console.log('\n📦 Registering players...');
        for (const uid of allPlayerIds) {
            for (const tid of tournamentIds) {
                yield client.query(`INSERT INTO sm.tournament_participants (tournament_id, user_id, status)
           VALUES ($1, $2, 'REGISTERED') ON CONFLICT DO NOTHING`, [tid, uid]);
            }
        }
        console.log('  ✅ Players registered');
        // ─── 8. Teams ───
        console.log('\n📦 Creating teams...');
        const teamIds = [];
        const teams = [
            { name: 'Thunder Smash', type: 'Doubles' },
            { name: 'Net Ninjas', type: 'Doubles' },
        ];
        for (const t of teams) {
            const exists = yield client.query(`SELECT id FROM sm.teams WHERE name = $1`, [t.name]);
            if (exists.rows.length > 0) {
                teamIds.push(exists.rows[0].id);
            }
            else {
                const r = yield client.query(`INSERT INTO sm.teams (name, type, created_by) VALUES ($1, $2, $3) RETURNING id`, [t.name, t.type, adminId]);
                teamIds.push(r.rows[0].id);
                const idx = teamIds.length - 1;
                yield client.query(`INSERT INTO sm.team_members (team_id, user_id, role, status) VALUES ($1, $2, 'captain', 'accepted'), ($1, $3, 'member', 'accepted') ON CONFLICT DO NOTHING`, [r.rows[0].id, allPlayerIds[idx * 2] || adminId, allPlayerIds[idx * 2 + 1] || dummyUsers[0]]);
            }
        }
        console.log(`  ✅ ${teamIds.length} teams ready`);
        // ─── 9. Courts ───
        console.log('\n📦 Creating courts...');
        const courtIds = [];
        const existingCourts = yield client.query(`SELECT id FROM sm.courts WHERE tournament_id = $1`, [tournamentIds[0]]);
        if (existingCourts.rows.length === 0) {
            for (let i = 1; i <= 4; i++) {
                const r = yield client.query(`INSERT INTO sm.courts (tournament_id, venue_id, name, court_number) VALUES ($1, $2, $3, $4) RETURNING id`, [tournamentIds[0], venueIds[0], `Court ${i}`, i]);
                courtIds.push(r.rows[0].id);
            }
        }
        else {
            courtIds.push(...existingCourts.rows.map((r) => r.id));
        }
        console.log(`  ✅ ${courtIds.length} courts ready`);
        // ─── 10. Matches (columns: tournament_id, round, player1_id, player2_id) ───
        console.log('\n📦 Creating matches...');
        const matchIds = [];
        const matchData = [
            { p1: 0, p2: 1, round: 'Round 1', status: 'LIVE' },
            { p1: 2, p2: 3, round: 'Round 1', status: 'UPCOMING' },
            { p1: 0, p2: 4, round: 'Round 2', status: 'COMPLETED' },
            { p1: 1, p2: 3, round: 'Round 2', status: 'UPCOMING' },
            { p1: 2, p2: 0, round: 'Quarter Final', status: 'CANCELLED' },
        ];
        for (const m of matchData) {
            const p1 = allPlayerIds[m.p1];
            const p2 = allPlayerIds[m.p2];
            const exists = yield client.query(`SELECT id FROM sm.matches WHERE tournament_id = $1 AND player1_id = $2 AND player2_id = $3 AND round = $4`, [tournamentIds[0], p1, p2, m.round]);
            if (exists.rows.length > 0) {
                matchIds.push(exists.rows[0].id);
            }
            else {
                const r = yield client.query(`INSERT INTO sm.matches (tournament_id, round, player1_id, player2_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [tournamentIds[0], m.round, p1, p2, m.status]);
                matchIds.push(r.rows[0].id);
                yield client.query(`INSERT INTO sm.match_scores (match_id) VALUES ($1) ON CONFLICT DO NOTHING`, [r.rows[0].id]);
            }
        }
        // Update completed match score
        if (matchIds[2]) {
            yield client.query(`UPDATE sm.match_scores SET player1_score = 21, player2_score = 15 WHERE match_id = $1`, [matchIds[2]]);
            yield client.query(`UPDATE sm.matches SET winner_id = $1 WHERE id = $2`, [allPlayerIds[0], matchIds[2]]);
        }
        // Update live match score
        if (matchIds[0]) {
            yield client.query(`UPDATE sm.match_scores SET player1_score = 15, player2_score = 12 WHERE match_id = $1`, [matchIds[0]]);
        }
        console.log(`  ✅ ${matchIds.length} matches ready`);
        // ─── 11. Payments ───
        console.log('\n📦 Creating payments...');
        const payments = [
            { uid: 0, tid: 0, amt: 500, status: 'COMPLETED' },
            { uid: 1, tid: 0, amt: 500, status: 'COMPLETED' },
            { uid: 2, tid: 1, amt: 300, status: 'PENDING' },
            { uid: 3, tid: 2, amt: 750, status: 'COMPLETED' },
            { uid: 0, tid: 2, amt: 200, status: 'REFUNDED' },
        ];
        for (const p of payments) {
            yield client.query(`INSERT INTO sm.payments (user_id, organization_id, tournament_id, amount, currency, provider, provider_session_id, type, status, meta)
         VALUES ($1, $2, $3, $4, 'INR', 'MANUAL', 'seed_' || gen_random_uuid()::text, 'REGISTRATION', $5, '{}'::jsonb)`, [allPlayerIds[p.uid], orgIds[0], tournamentIds[p.tid], p.amt, p.status]);
        }
        console.log('  ✅ Payments recorded');
        // ─── 12. Notifications ───
        console.log('\n📦 Creating notifications...');
        for (const uid of allPlayerIds.slice(0, 4)) {
            yield client.query(`INSERT INTO sm.notifications (user_id, title, body, type, is_read) VALUES
         ($1, 'Welcome to SmashFIT!', 'Your account is ready. Join a tournament to get started.', 'info', false),
         ($1, 'Tournament Registration', 'You have been registered for Winter Open 2026.', 'tournament', false),
         ($1, 'Match Alert', 'Your next match is on Court 2 at 3:00 PM.', 'match', false),
         ($1, 'Payment Confirmed', 'Payment of ₹500 for Winter Open received.', 'payment', true)`, [uid]);
        }
        console.log('  ✅ Notifications sent');
        // ─── 13. User Activities ───
        console.log('\n📦 Creating user activities...');
        const activities = [
            { uid: 0, act: 'TOURNAMENT_JOIN', desc: 'Joined Winter Open 2026' },
            { uid: 0, act: 'MATCH_WIN', desc: 'Won Round 2 match vs Rahul Verma (21-15)' },
            { uid: 1, act: 'TOURNAMENT_JOIN', desc: 'Joined Winter Open 2026' },
            { uid: 2, act: 'TEAM_CREATE', desc: 'Created team Thunder Smash' },
            { uid: 3, act: 'PAYMENT', desc: 'Paid ₹750 for Delhi Masters 2026' },
        ];
        for (const a of activities) {
            yield client.query(`INSERT INTO sm.user_activities (user_id, action_type, description) VALUES ($1, $2, $3)`, [allPlayerIds[a.uid], a.act, a.desc]);
        }
        console.log('  ✅ Activities logged');
        // ─── 14. User Settings ───
        console.log('\n📦 Creating user settings...');
        for (const uid of allPlayerIds) {
            yield client.query(`INSERT INTO sm.user_settings (user_id, email_notifications, push_notifications, profile_visibility, theme)
         VALUES ($1, true, true, 'public', 'light') ON CONFLICT (user_id) DO NOTHING`, [uid]);
        }
        console.log('  ✅ Settings initialized');
        // ─── 15. Shuttle Logs ───
        console.log('\n📦 Creating shuttle logs...');
        yield client.query(`INSERT INTO sm.tournament_shuttles (tournament_id, brand, quantity, logged_by)
       VALUES ($1, 'Yonex Mavis 350', 24, $2), ($1, 'Li-Ning A+60', 12, $2)`, [tournamentIds[0], adminId]);
        console.log('  ✅ Shuttle logs added');
        // ─── 16. Audit Logs ───
        console.log('\n📦 Creating audit logs...');
        const audits = [
            { act: 'USER_LOGIN', ent: 'user', det: '{"message":"Admin logged in"}' },
            { act: 'TOURNAMENT_CREATE', ent: 'tournament', det: '{"message":"Created Winter Open 2026"}' },
            { act: 'MATCH_SCORE_UPDATE', ent: 'match', det: '{"message":"Updated score for Match #1"}' },
            { act: 'PAYMENT_RECEIVED', ent: 'payment', det: '{"message":"Payment of 500 INR received"}' },
        ];
        for (const a of audits) {
            yield client.query(`INSERT INTO sm.audit_logs (actor_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5::jsonb, '192.168.1.1')`, [adminId, a.act, a.ent, adminId, a.det]);
        }
        console.log('  ✅ Audit logs added');
        console.log('\n🎉 ════════════════════════════════════════');
        console.log('   ALL TABLES SEEDED SUCCESSFULLY!');
        console.log('   ════════════════════════════════════════\n');
    }
    catch (error) {
        console.error('\n❌ Seed failed:', error.message);
        console.error('   Detail:', error.detail || 'none');
        console.error('   Table:', error.table || 'unknown');
        console.error('   Column:', error.column || 'unknown');
        console.error('   Hint:', error.hint || 'none');
    }
    finally {
        client.release();
        yield db_1.default.end();
    }
});
seedAll();

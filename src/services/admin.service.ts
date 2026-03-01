import pool from "../config/db";
import { AuditRepository, ApiKeyRepository, SettingsRepository, PrivacyRepository, SearchRepository, DisputeRepository } from "../repositories/admin.repository";
import { LeaderboardRepository } from "../repositories/leaderboard.repository";

const auditRepo = new AuditRepository();
const apiKeyRepo = new ApiKeyRepository();
const settingsRepo = new SettingsRepository();
const privacyRepo = new PrivacyRepository();
const searchRepo = new SearchRepository();
const disputeRepo = new DisputeRepository();
const leaderboardRepo = new LeaderboardRepository();

export class AdminService {

    // ── Health ────────────────────────────
    async healthCheck() {
        const dbStart = Date.now();
        await pool.query('SELECT 1');
        return {
            status: 'OK',
            uptime: process.uptime(),
            db_latency_ms: Date.now() - dbStart,
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
        };
    }

    async readiness() {
        try { await pool.query('SELECT 1'); return { ready: true }; }
        catch { return { ready: false }; }
    }

    async liveness() { return { alive: true, uptime: process.uptime() }; }

    // ── Reindex ───────────────────────────
    async reindex() {
        const rankResult = await leaderboardRepo.recalculateRanks();
        return { message: 'Re-indexed leaderboard', ...rankResult };
    }

    // ── Audit ─────────────────────────────
    async getAuditLogs(page: number = 1) {
        return auditRepo.getLogs(50, (page - 1) * 50);
    }

    async writeAudit(actorId: string | null, action: string, entityType?: string, entityId?: string, details?: any, ip?: string) {
        return auditRepo.log(actorId, action, entityType, entityId, details, ip);
    }

    // ── GDPR / Privacy ───────────────────
    async exportUserData(userId: string) {
        return privacyRepo.exportUserData(userId);
    }

    async deleteUserData(userId: string) {
        return privacyRepo.deleteUserData(userId);
    }

    // ── Disputes ──────────────────────────
    async getActiveDisputes() {
        return disputeRepo.getActiveDisputes();
    }

    // ── API Keys ──────────────────────────
    async createApiKey(userId: string, name: string, scopes?: string[]) {
        if (!name?.trim()) throw new Error('API key name is required');
        return apiKeyRepo.create(name, scopes || ['read'], userId);
    }

    async listApiKeys(userId: string) {
        return apiKeyRepo.list(userId);
    }

    // ── Settings ──────────────────────────
    async getSettings() {
        return settingsRepo.getAll();
    }

    async startMaintenance(userId: string) {
        await settingsRepo.set('maintenance_mode', 'on', userId);
        await this.writeAudit(userId, 'MAINTENANCE_START');
        return { maintenance_mode: 'on' };
    }

    async stopMaintenance(userId: string) {
        await settingsRepo.set('maintenance_mode', 'off', userId);
        await this.writeAudit(userId, 'MAINTENANCE_STOP');
        return { maintenance_mode: 'off' };
    }

    // ── Search ────────────────────────────
    async search(query: string) {
        if (!query?.trim()) throw new Error('Search query is required');
        return searchRepo.siteWideSearch(query.trim());
    }
}

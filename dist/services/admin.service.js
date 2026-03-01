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
exports.AdminService = void 0;
const db_1 = __importDefault(require("../config/db"));
const admin_repository_1 = require("../repositories/admin.repository");
const leaderboard_repository_1 = require("../repositories/leaderboard.repository");
const auditRepo = new admin_repository_1.AuditRepository();
const apiKeyRepo = new admin_repository_1.ApiKeyRepository();
const settingsRepo = new admin_repository_1.SettingsRepository();
const privacyRepo = new admin_repository_1.PrivacyRepository();
const searchRepo = new admin_repository_1.SearchRepository();
const disputeRepo = new admin_repository_1.DisputeRepository();
const leaderboardRepo = new leaderboard_repository_1.LeaderboardRepository();
class AdminService {
    // ── Health ────────────────────────────
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            const dbStart = Date.now();
            yield db_1.default.query('SELECT 1');
            return {
                status: 'OK',
                uptime: process.uptime(),
                db_latency_ms: Date.now() - dbStart,
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString(),
            };
        });
    }
    readiness() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield db_1.default.query('SELECT 1');
                return { ready: true };
            }
            catch (_a) {
                return { ready: false };
            }
        });
    }
    liveness() {
        return __awaiter(this, void 0, void 0, function* () { return { alive: true, uptime: process.uptime() }; });
    }
    // ── Reindex ───────────────────────────
    reindex() {
        return __awaiter(this, void 0, void 0, function* () {
            const rankResult = yield leaderboardRepo.recalculateRanks();
            return Object.assign({ message: 'Re-indexed leaderboard' }, rankResult);
        });
    }
    // ── Audit ─────────────────────────────
    getAuditLogs() {
        return __awaiter(this, arguments, void 0, function* (page = 1) {
            return auditRepo.getLogs(50, (page - 1) * 50);
        });
    }
    writeAudit(actorId, action, entityType, entityId, details, ip) {
        return __awaiter(this, void 0, void 0, function* () {
            return auditRepo.log(actorId, action, entityType, entityId, details, ip);
        });
    }
    // ── GDPR / Privacy ───────────────────
    exportUserData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return privacyRepo.exportUserData(userId);
        });
    }
    deleteUserData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return privacyRepo.deleteUserData(userId);
        });
    }
    // ── Disputes ──────────────────────────
    getActiveDisputes() {
        return __awaiter(this, void 0, void 0, function* () {
            return disputeRepo.getActiveDisputes();
        });
    }
    // ── API Keys ──────────────────────────
    createApiKey(userId, name, scopes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(name === null || name === void 0 ? void 0 : name.trim()))
                throw new Error('API key name is required');
            return apiKeyRepo.create(name, scopes || ['read'], userId);
        });
    }
    listApiKeys(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return apiKeyRepo.list(userId);
        });
    }
    // ── Settings ──────────────────────────
    getSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            return settingsRepo.getAll();
        });
    }
    startMaintenance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield settingsRepo.set('maintenance_mode', 'on', userId);
            yield this.writeAudit(userId, 'MAINTENANCE_START');
            return { maintenance_mode: 'on' };
        });
    }
    stopMaintenance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield settingsRepo.set('maintenance_mode', 'off', userId);
            yield this.writeAudit(userId, 'MAINTENANCE_STOP');
            return { maintenance_mode: 'off' };
        });
    }
    // ── Search ────────────────────────────
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(query === null || query === void 0 ? void 0 : query.trim()))
                throw new Error('Search query is required');
            return searchRepo.siteWideSearch(query.trim());
        });
    }
}
exports.AdminService = AdminService;

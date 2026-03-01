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
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteSearch = exports.maintenanceStop = exports.maintenanceStart = exports.getSettings = exports.listApiKeys = exports.createApiKey = exports.getDisputes = exports.deleteUser = exports.exportUser = exports.getAuditLogs = exports.reindex = exports.liveness = exports.readiness = exports.healthCheck = void 0;
const admin_service_1 = require("../services/admin.service");
const svc = new admin_service_1.AdminService();
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, e) => res.status(e.message.includes('not found') ? 404 : 400).json({ success: false, message: e.message });
// GET /api/admin/health
const healthCheck = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.healthCheck());
    }
    catch (e) {
        fail(res, e);
    }
});
exports.healthCheck = healthCheck;
// GET /api/health/readiness
const readiness = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const r = yield svc.readiness();
        res.status(r.ready ? 200 : 503).json({ success: r.ready, data: r });
    }
    catch (e) {
        res.status(503).json({ success: false, data: { ready: false } });
    }
});
exports.readiness = readiness;
// GET /api/health/liveness
const liveness = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.liveness());
    }
    catch (e) {
        fail(res, e);
    }
});
exports.liveness = liveness;
// POST /api/admin/reindex
const reindex = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.reindex());
    }
    catch (e) {
        fail(res, e);
    }
});
exports.reindex = reindex;
// GET /api/admin/audit-logs
const getAuditLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        ok(res, yield svc.getAuditLogs(page));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getAuditLogs = getAuditLogs;
// GET /api/privacy/export-user/:id
const exportUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.exportUserData(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.exportUser = exportUser;
// DELETE /api/privacy/delete-user/:id
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.deleteUserData(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.deleteUser = deleteUser;
// GET /api/admin/disputes
const getDisputes = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getActiveDisputes());
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getDisputes = getDisputes;
// POST /api/api-keys
const createApiKey = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, scopes } = req.body;
        ok(res, yield svc.createApiKey(req.user.id, name, scopes), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.createApiKey = createApiKey;
// GET /api/api-keys
const listApiKeys = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.listApiKeys(req.user.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.listApiKeys = listApiKeys;
// GET /api/settings
const getSettings = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.getSettings());
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getSettings = getSettings;
// POST /api/admin/maintenance/start
const maintenanceStart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.startMaintenance(req.user.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.maintenanceStart = maintenanceStart;
// POST /api/admin/maintenance/stop
const maintenanceStop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield svc.stopMaintenance(req.user.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.maintenanceStop = maintenanceStop;
// GET /api/search
const siteSearch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.query.q;
        if (!(q === null || q === void 0 ? void 0 : q.trim()))
            return res.status(400).json({ success: false, message: 'Query param ?q= is required' });
        ok(res, yield svc.search(q));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.siteSearch = siteSearch;

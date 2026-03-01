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
exports.addSponsor = exports.getWebhookLogs = exports.registerWebhook = exports.getReport = exports.exportCSV = exports.deleteUpload = exports.getUpload = exports.uploadFile = exports.notifyPlayers = exports.sendNotification = void 0;
const notification_service_1 = require("../services/notification.service");
const notifSvc = new notification_service_1.NotificationService();
const uploadSvc = new notification_service_1.UploadService();
const webhookSvc = new notification_service_1.WebhookService();
const sponsorSvc = new notification_service_1.SponsorService();
const exportSvc = new notification_service_1.ExportService();
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, e) => res.status(e.message.includes('not found') ? 404 : 400).json({ success: false, message: e.message });
// POST /api/notifications/send
const sendNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, title, body, type, meta } = req.body;
        ok(res, yield notifSvc.send(userId, title, body, type, meta), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.sendNotification = sendNotification;
// POST /api/tournaments/:id/notify-players
const notifyPlayers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, body } = req.body;
        ok(res, yield notifSvc.notifyTournamentPlayers(req.params.id, title, body));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.notifyPlayers = notifyPlayers;
// POST /api/uploads
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        if (!file)
            return res.status(400).json({ success: false, message: "No file provided" });
        ok(res, yield uploadSvc.upload(file, req.user.id), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.uploadFile = uploadFile;
// GET /api/uploads/:id
const getUpload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield uploadSvc.getFile(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getUpload = getUpload;
// DELETE /api/uploads/:id
const deleteUpload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield uploadSvc.deleteFile(req.params.id);
        ok(res, { deleted: true });
    }
    catch (e) {
        fail(res, e);
    }
});
exports.deleteUpload = deleteUpload;
// GET /api/tournaments/:id/export/csv
const exportCSV = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield exportSvc.exportCSV(req.params.id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=tournament-${req.params.id}.csv`);
        res.send(data.participants_csv + '\n\n--- MATCHES ---\n\n' + data.matches_csv);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.exportCSV = exportCSV;
// GET /api/tournaments/:id/report
const getReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield exportSvc.getReport(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getReport = getReport;
// POST /api/webhooks
const registerWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { url, events, secret } = req.body;
        ok(res, yield webhookSvc.register(req.user.id, url, events, secret), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.registerWebhook = registerWebhook;
// GET /api/webhooks/:id/logs
const getWebhookLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield webhookSvc.getLogs(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getWebhookLogs = getWebhookLogs;
// POST /api/tournaments/:id/sponsors
const addSponsor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield sponsorSvc.addSponsor(req.params.id, req.body), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.addSponsor = addSponsor;

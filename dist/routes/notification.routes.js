"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = exports.uploadRoutes = void 0;
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/notifications/send
router.post("/send", auth_middleware_1.verifyAuth, notification_controller_1.sendNotification);
exports.default = router;
// ── Separate router exports for uploads & webhooks ──────────
exports.uploadRoutes = (() => {
    const r = (0, express_1.Router)();
    r.post("/", auth_middleware_1.verifyAuth, notification_controller_1.uploadFile);
    r.get("/:id", notification_controller_1.getUpload);
    r.delete("/:id", auth_middleware_1.verifyAuth, notification_controller_1.deleteUpload);
    return r;
})();
exports.webhookRoutes = (() => {
    const r = (0, express_1.Router)();
    r.post("/", auth_middleware_1.verifyAuth, notification_controller_1.registerWebhook);
    r.get("/:id/logs", notification_controller_1.getWebhookLogs);
    return r;
})();

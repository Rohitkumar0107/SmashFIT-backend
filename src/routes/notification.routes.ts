import { Router } from "express";
import { sendNotification, uploadFile, getUpload, deleteUpload, registerWebhook, getWebhookLogs } from "../controllers/notification.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// POST /api/notifications/send
router.post("/send", verifyAuth, sendNotification);

export default router;

// ── Separate router exports for uploads & webhooks ──────────
export const uploadRoutes = (() => {
    const r = Router();
    r.post("/", verifyAuth, uploadFile);
    r.get("/:id", getUpload);
    r.delete("/:id", verifyAuth, deleteUpload);
    return r;
})();

export const webhookRoutes = (() => {
    const r = Router();
    r.post("/", verifyAuth, registerWebhook);
    r.get("/:id/logs", getWebhookLogs);
    return r;
})();

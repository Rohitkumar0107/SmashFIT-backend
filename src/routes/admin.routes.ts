import { Router } from "express";
import {
    healthCheck, reindex, getAuditLogs, getDisputes,
    maintenanceStart, maintenanceStop,
} from "../controllers/admin.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/admin/health
router.get("/health", healthCheck);

// POST /api/admin/reindex
router.post("/reindex", verifyAuth, reindex);

// GET /api/admin/audit-logs
router.get("/audit-logs", verifyAuth, getAuditLogs);

// GET /api/admin/disputes
router.get("/disputes", verifyAuth, getDisputes);

// POST /api/admin/maintenance/start
router.post("/maintenance/start", verifyAuth, maintenanceStart);

// POST /api/admin/maintenance/stop
router.post("/maintenance/stop", verifyAuth, maintenanceStop);

export default router;

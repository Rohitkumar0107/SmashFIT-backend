import { Router } from "express";
import { exportUser, deleteUser, createApiKey, listApiKeys, getSettings, siteSearch } from "../controllers/admin.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// ── Privacy ─────────────────────────────
router.get("/privacy/export-user/:id", verifyAuth, exportUser);
router.delete("/privacy/delete-user/:id", verifyAuth, deleteUser);

// ── API Keys ────────────────────────────
router.post("/api-keys", verifyAuth, createApiKey);
router.get("/api-keys", verifyAuth, listApiKeys);

// ── Settings ────────────────────────────
router.get("/settings", getSettings);

// ── Search ──────────────────────────────
router.get("/search", siteSearch);

export default router;

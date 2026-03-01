import { Router } from "express";
import { readiness, liveness } from "../controllers/admin.controller";

const router = Router();

router.get("/readiness", readiness);
router.get("/liveness", liveness);

export default router;

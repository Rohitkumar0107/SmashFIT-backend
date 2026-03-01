import { Router } from "express";
import { getSchedule } from "../controllers/venue.controller";

const router = Router();

// GET /api/schedules/:id
router.get("/:id", getSchedule);

export default router;

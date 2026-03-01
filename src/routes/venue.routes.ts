import { Router } from "express";
import { createVenue, getVenue, getSchedule } from "../controllers/venue.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// POST /api/venues
router.post("/", verifyAuth, createVenue);

// GET /api/venues/:id
router.get("/:id", getVenue);

export default router;

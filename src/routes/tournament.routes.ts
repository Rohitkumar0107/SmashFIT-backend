import { Router } from "express";
import { createTournament, getAllTournaments, getTournamentById, registerPlayer } from "../controllers/tournament.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// 🔒 PROTECTED ROUTES (Sirf logged-in organizer bana sakta hai)
router.post("/create", verifyAuth, createTournament);


// 🌍 PUBLIC ROUTES (Koi bhi dekh sakta hai)
router.get("/all", verifyAuth, getAllTournaments);
router.get("/:id", verifyAuth, getTournamentById);

//for regestering player in tournament
router.post("/register", verifyAuth, registerPlayer);


export default router;
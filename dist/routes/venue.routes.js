"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const venue_controller_1 = require("../controllers/venue.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/venues
router.post("/", auth_middleware_1.verifyAuth, venue_controller_1.createVenue);
// GET /api/venues/:id
router.get("/:id", venue_controller_1.getVenue);
exports.default = router;

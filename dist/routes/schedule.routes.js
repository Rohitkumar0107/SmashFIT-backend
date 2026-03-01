"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const venue_controller_1 = require("../controllers/venue.controller");
const router = (0, express_1.Router)();
// GET /api/schedules/:id
router.get("/:id", venue_controller_1.getSchedule);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const match_controller_1 = require("../controllers/match.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// matchRoutes.ts mein naya route
router.get('/all', auth_middleware_1.verifyAuth, match_controller_1.getAllMatches); // GET /api/matches
router.get('/:id', auth_middleware_1.verifyAuth, match_controller_1.getMatchById); // GET /api/matches/:id
exports.default = router;

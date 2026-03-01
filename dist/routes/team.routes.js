"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const team_controller_1 = require("../controllers/team.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/teams — create team
router.post('/', auth_middleware_1.verifyAuth, team_controller_1.createTeam);
// GET /api/teams/:id — view team
router.get('/:id', auth_middleware_1.verifyAuth, team_controller_1.getTeam);
// POST /api/teams/:id/members — invite member
router.post('/:id/members', auth_middleware_1.verifyAuth, team_controller_1.addTeamMember);
exports.default = router;

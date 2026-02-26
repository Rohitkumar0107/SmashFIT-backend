"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Dashboard Public bhi ho sakta hai (Viewers ke liye) 
// Agar sirf logged-in users ko dikhana hai toh verifyAuth laga do
router.get('/summary', auth_middleware_1.verifyAuth, dashboard_controller_1.getDashboardSummary);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/billing/org/:id  (alias for organization)
router.get("/org/:id", auth_middleware_1.verifyAuth, payment_controller_1.orgBilling);
// backwards compatibility
router.get("/organization/:id", auth_middleware_1.verifyAuth, payment_controller_1.orgBilling);
// GET /api/billing/plans
router.get("/plans", payment_controller_1.getPlans);
// POST /api/billing/subscriptions
router.post("/subscriptions", auth_middleware_1.verifyAuth, payment_controller_1.manageSubscription);
// GET /api/billing/payouts
router.get("/payouts", auth_middleware_1.verifyAuth, payment_controller_1.getPayouts);
exports.default = router;

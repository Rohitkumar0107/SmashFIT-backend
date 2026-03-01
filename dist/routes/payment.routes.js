"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/pay/create-checkout  (mounted on both /pay and /payments)
router.post("/create-checkout", auth_middleware_1.verifyAuth, payment_controller_1.createCheckout);
// POST /api/pay/webhook (public — called by Razorpay/Stripe)
router.post("/webhook", payment_controller_1.paymentWebhook);
// POST /api/pay/refund
router.post("/refund", auth_middleware_1.verifyAuth, payment_controller_1.processRefund);
// POST /api/pay/verify
router.post("/verify", auth_middleware_1.verifyAuth, payment_controller_1.verifyPayment);
// GET /api/pay/history
router.get("/history", auth_middleware_1.verifyAuth, payment_controller_1.paymentHistory);
exports.default = router;

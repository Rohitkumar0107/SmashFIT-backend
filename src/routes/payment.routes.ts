import { Router } from "express";
import {
  createCheckout,
  paymentWebhook,
  processRefund,
  verifyPayment,
  paymentHistory,
} from "../controllers/payment.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// POST /api/pay/create-checkout  (mounted on both /pay and /payments)
router.post("/create-checkout", verifyAuth, createCheckout);

// POST /api/pay/webhook (public — called by Razorpay/Stripe)
router.post("/webhook", paymentWebhook);

// POST /api/pay/refund
router.post("/refund", verifyAuth, processRefund);

// POST /api/pay/verify
router.post("/verify", verifyAuth, verifyPayment);

// GET /api/pay/history
router.get("/history", verifyAuth, paymentHistory);

export default router;

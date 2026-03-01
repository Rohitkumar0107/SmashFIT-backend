import { Router } from "express";
import {
  orgBilling,
  getPlans,
  manageSubscription,
  getPayouts,
} from "../controllers/payment.controller";
import { verifyAuth } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/billing/org/:id  (alias for organization)
router.get("/org/:id", verifyAuth, orgBilling);
// backwards compatibility
router.get("/organization/:id", verifyAuth, orgBilling);

// GET /api/billing/plans
router.get("/plans", getPlans);

// POST /api/billing/subscriptions
router.post("/subscriptions", verifyAuth, manageSubscription);

// GET /api/billing/payouts
router.get("/payouts", verifyAuth, getPayouts);

export default router;

import { Request, Response } from "express";
import { PaymentService, BillingService } from "../services/payment.service";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";

const paymentSvc = new PaymentService();
const billingSvc = new BillingService();

const ok = (res: Response, data: any, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, e: any) => res.status(e.message.includes('not found') ? 404 : 400).json({ success: false, message: e.message });

// POST /api/payments/create-checkout
export const createCheckout = async (req: AuthenticatedRequest, res: Response) => {
    try { ok(res, await paymentSvc.createCheckout(req.user!.id, req.body), 201); }
    catch (e: any) { fail(res, e); }
};

// POST /api/payments/webhook (public — no auth, called by payment provider)
export const paymentWebhook = async (req: Request, res: Response) => {
    try {
        const provider = (req.query.provider as string) || 'RAZORPAY';
        const event = req.body.event || req.headers['x-razorpay-event'] || 'payment.captured';
        ok(res, await paymentSvc.handleWebhook(provider, event as string, req.body));
    } catch (e: any) { fail(res, e); }
};

// POST /api/payments/refund
export const processRefund = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) return res.status(400).json({ success: false, message: 'paymentId required' });
        ok(res, await paymentSvc.refund(paymentId));
    } catch (e: any) { fail(res, e); }
};

// POST /api/payments/verify
export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { paymentId, providerPaymentId } = req.body;
        ok(res, await paymentSvc.verify(paymentId, providerPaymentId));
    } catch (e: any) { fail(res, e); }
};

// GET /api/payments/history
export const paymentHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.query.userId as string || req.user!.id;
        const orgId = req.query.orgId as string;
        ok(res, await paymentSvc.getHistory(userId, orgId));
    } catch (e: any) { fail(res, e); }
};

// GET /api/billing/organization/:id
export const orgBilling = async (req: Request, res: Response) => {
    try { ok(res, await billingSvc.getOrgBilling(req.params.id as string)); }
    catch (e: any) { fail(res, e); }
};

// GET /api/billing/plans
export const getPlans = async (_: Request, res: Response) => {
    try { ok(res, await billingSvc.getPlans()); }
    catch (e: any) { fail(res, e); }
};

// POST /api/billing/subscriptions
export const manageSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orgId, planId, providerSubId } = req.body;
        ok(res, await billingSvc.subscribe(orgId, planId, providerSubId), 201);
    } catch (e: any) { fail(res, e); }
};

// GET /api/billing/payouts
export const getPayouts = async (req: Request, res: Response) => {
    try {
        const orgId = req.query.orgId as string;
        ok(res, await billingSvc.getPayouts(orgId));
    } catch (e: any) { fail(res, e); }
};

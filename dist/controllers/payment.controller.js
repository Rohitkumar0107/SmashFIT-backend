"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayouts = exports.manageSubscription = exports.getPlans = exports.orgBilling = exports.paymentHistory = exports.verifyPayment = exports.processRefund = exports.paymentWebhook = exports.createCheckout = void 0;
const payment_service_1 = require("../services/payment.service");
const paymentSvc = new payment_service_1.PaymentService();
const billingSvc = new payment_service_1.BillingService();
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, e) => res.status(e.message.includes('not found') ? 404 : 400).json({ success: false, message: e.message });
// POST /api/payments/create-checkout
const createCheckout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield paymentSvc.createCheckout(req.user.id, req.body), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.createCheckout = createCheckout;
// POST /api/payments/webhook (public — no auth, called by payment provider)
const paymentWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const provider = req.query.provider || 'RAZORPAY';
        const event = req.body.event || req.headers['x-razorpay-event'] || 'payment.captured';
        ok(res, yield paymentSvc.handleWebhook(provider, event, req.body));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.paymentWebhook = paymentWebhook;
// POST /api/payments/refund
const processRefund = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentId } = req.body;
        if (!paymentId)
            return res.status(400).json({ success: false, message: 'paymentId required' });
        ok(res, yield paymentSvc.refund(paymentId));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.processRefund = processRefund;
// POST /api/payments/verify
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentId, providerPaymentId } = req.body;
        ok(res, yield paymentSvc.verify(paymentId, providerPaymentId));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.verifyPayment = verifyPayment;
// GET /api/payments/history
const paymentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId || req.user.id;
        const orgId = req.query.orgId;
        ok(res, yield paymentSvc.getHistory(userId, orgId));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.paymentHistory = paymentHistory;
// GET /api/billing/organization/:id
const orgBilling = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield billingSvc.getOrgBilling(req.params.id));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.orgBilling = orgBilling;
// GET /api/billing/plans
const getPlans = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ok(res, yield billingSvc.getPlans());
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getPlans = getPlans;
// POST /api/billing/subscriptions
const manageSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orgId, planId, providerSubId } = req.body;
        ok(res, yield billingSvc.subscribe(orgId, planId, providerSubId), 201);
    }
    catch (e) {
        fail(res, e);
    }
});
exports.manageSubscription = manageSubscription;
// GET /api/billing/payouts
const getPayouts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgId = req.query.orgId;
        ok(res, yield billingSvc.getPayouts(orgId));
    }
    catch (e) {
        fail(res, e);
    }
});
exports.getPayouts = getPayouts;

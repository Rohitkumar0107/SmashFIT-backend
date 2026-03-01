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
exports.BillingService = exports.PaymentService = void 0;
const payment_repository_1 = require("../repositories/payment.repository");
const paymentRepo = new payment_repository_1.PaymentRepository();
const billingRepo = new payment_repository_1.BillingRepository();
class PaymentService {
    createCheckout(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.amount || data.amount <= 0)
                throw new Error("Valid amount is required");
            // Generate a mock session ID (replace with real Razorpay/Stripe call in production)
            const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            const payment = yield paymentRepo.createCheckout({
                user_id: userId,
                organization_id: data.organization_id || null,
                tournament_id: data.tournament_id || null,
                amount: data.amount,
                currency: data.currency,
                provider: data.provider || 'RAZORPAY',
                session_id: sessionId,
                type: data.type || 'REGISTRATION',
                meta: data.meta,
            });
            return {
                payment_id: payment.id,
                session_id: sessionId,
                checkout_url: `https://pay.example.com/checkout/${sessionId}`,
                amount: payment.amount,
                currency: payment.currency,
            };
        });
    }
    handleWebhook(provider, event, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            // Look up payment by session or provider payment ID
            const sessionId = payload.session_id || payload.razorpay_order_id || payload.id;
            if (!sessionId)
                throw new Error("No session identifier in webhook payload");
            const payment = yield paymentRepo.findBySessionId(sessionId);
            if (!payment)
                throw new Error("Payment not found for session: " + sessionId);
            let newStatus = payment.status;
            if (event === 'payment.captured' || event === 'checkout.session.completed')
                newStatus = 'COMPLETED';
            else if (event === 'payment.failed')
                newStatus = 'FAILED';
            else if (event === 'refund.created')
                newStatus = 'REFUNDED';
            yield paymentRepo.updateStatus(payment.id, newStatus, payload.payment_id);
            return { payment_id: payment.id, new_status: newStatus };
        });
    }
    refund(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const payment = yield paymentRepo.findById(paymentId);
            if (!payment)
                throw new Error("Payment not found");
            if (payment.status !== 'COMPLETED')
                throw new Error("Can only refund completed payments");
            return paymentRepo.updateStatus(paymentId, 'REFUNDED');
        });
    }
    verify(paymentId, providerPaymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const payment = yield paymentRepo.findById(paymentId);
            if (!payment)
                throw new Error("Payment not found");
            return paymentRepo.updateStatus(paymentId, 'COMPLETED', providerPaymentId);
        });
    }
    getHistory(userId, orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            return paymentRepo.getHistory(userId, orgId);
        });
    }
}
exports.PaymentService = PaymentService;
class BillingService {
    getOrgBilling(orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            return billingRepo.getOrgBilling(orgId);
        });
    }
    getPlans() {
        return __awaiter(this, void 0, void 0, function* () {
            return billingRepo.getPlans();
        });
    }
    subscribe(orgId, planId, providerSubId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!planId)
                throw new Error("Plan ID is required");
            return billingRepo.createSubscription(orgId, planId, providerSubId);
        });
    }
    getPayouts(orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            return billingRepo.getPayouts(orgId);
        });
    }
}
exports.BillingService = BillingService;

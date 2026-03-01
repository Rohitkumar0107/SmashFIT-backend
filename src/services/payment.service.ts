import { PaymentRepository, BillingRepository } from "../repositories/payment.repository";

const paymentRepo = new PaymentRepository();
const billingRepo = new BillingRepository();

export class PaymentService {

    async createCheckout(userId: string, data: any) {
        if (!data.amount || data.amount <= 0) throw new Error("Valid amount is required");

        // Generate a mock session ID (replace with real Razorpay/Stripe call in production)
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

        const payment = await paymentRepo.createCheckout({
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
    }

    async handleWebhook(provider: string, event: string, payload: any) {
        // Look up payment by session or provider payment ID
        const sessionId = payload.session_id || payload.razorpay_order_id || payload.id;
        if (!sessionId) throw new Error("No session identifier in webhook payload");

        const payment = await paymentRepo.findBySessionId(sessionId);
        if (!payment) throw new Error("Payment not found for session: " + sessionId);

        let newStatus = payment.status;
        if (event === 'payment.captured' || event === 'checkout.session.completed') newStatus = 'COMPLETED';
        else if (event === 'payment.failed') newStatus = 'FAILED';
        else if (event === 'refund.created') newStatus = 'REFUNDED';

        await paymentRepo.updateStatus(payment.id, newStatus, payload.payment_id);
        return { payment_id: payment.id, new_status: newStatus };
    }

    async refund(paymentId: string) {
        const payment = await paymentRepo.findById(paymentId);
        if (!payment) throw new Error("Payment not found");
        if (payment.status !== 'COMPLETED') throw new Error("Can only refund completed payments");
        return paymentRepo.updateStatus(paymentId, 'REFUNDED');
    }

    async verify(paymentId: string, providerPaymentId: string) {
        const payment = await paymentRepo.findById(paymentId);
        if (!payment) throw new Error("Payment not found");
        return paymentRepo.updateStatus(paymentId, 'COMPLETED', providerPaymentId);
    }

    async getHistory(userId?: string, orgId?: string) {
        return paymentRepo.getHistory(userId, orgId);
    }
}

export class BillingService {

    async getOrgBilling(orgId: string) {
        return billingRepo.getOrgBilling(orgId);
    }

    async getPlans() {
        return billingRepo.getPlans();
    }

    async subscribe(orgId: string, planId: number, providerSubId?: string) {
        if (!planId) throw new Error("Plan ID is required");
        return billingRepo.createSubscription(orgId, planId, providerSubId);
    }

    async getPayouts(orgId?: string) {
        return billingRepo.getPayouts(orgId);
    }
}

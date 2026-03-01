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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingRepository = exports.PaymentRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class PaymentRepository {
    createCheckout(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      INSERT INTO sm.payments (user_id, organization_id, tournament_id, amount, currency, provider, provider_session_id, type, meta)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb) RETURNING *
    `, [data.user_id, data.organization_id, data.tournament_id, data.amount, data.currency || 'INR',
                data.provider || 'RAZORPAY', data.session_id, data.type || 'REGISTRATION', JSON.stringify(data.meta || {})]);
            return rows[0];
        });
    }
    findBySessionId(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`SELECT * FROM sm.payments WHERE provider_session_id = $1`, [sessionId]);
            return rows[0] || null;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`SELECT * FROM sm.payments WHERE id = $1`, [id]);
            return rows[0] || null;
        });
    }
    updateStatus(id, status, providerPaymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      UPDATE sm.payments SET status = $1, provider_payment_id = COALESCE($2, provider_payment_id), updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [status, providerPaymentId, id]);
            return rows[0];
        });
    }
    getHistory(userId_1, orgId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, orgId, limit = 50) {
            let where = 'WHERE 1=1';
            const params = [];
            if (userId) {
                params.push(userId);
                where += ` AND p.user_id = $${params.length}`;
            }
            if (orgId) {
                params.push(orgId);
                where += ` AND p.organization_id = $${params.length}`;
            }
            params.push(limit);
            const { rows } = yield db_1.default.query(`
      SELECT p.*, u.full_name AS user_name, o.name AS org_name, t.name AS tournament_name
      FROM sm.payments p
      LEFT JOIN sm.users u ON p.user_id = u.id
      LEFT JOIN sm.organizations o ON p.organization_id = o.id
      LEFT JOIN sm.tournaments t ON p.tournament_id = t.id
      ${where} ORDER BY p.created_at DESC LIMIT $${params.length}
    `, params);
            return rows;
        });
    }
}
exports.PaymentRepository = PaymentRepository;
class BillingRepository {
    getOrgBilling(orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [invoices, subscription, totals] = yield Promise.all([
                db_1.default.query(`SELECT * FROM sm.invoices WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 20`, [orgId]),
                db_1.default.query(`
        SELECT s.*, p.name AS plan_name, p.price, p.interval
        FROM sm.subscriptions s LEFT JOIN sm.plans p ON s.plan_id = p.id
        WHERE s.organization_id = $1 AND s.status = 'ACTIVE' LIMIT 1
      `, [orgId]),
                db_1.default.query(`
        SELECT COALESCE(SUM(amount), 0) AS total_paid FROM sm.payments
        WHERE organization_id = $1 AND status = 'COMPLETED'
      `, [orgId]),
            ]);
            return {
                invoices: invoices.rows,
                subscription: subscription.rows[0] || null,
                total_paid: ((_a = totals.rows[0]) === null || _a === void 0 ? void 0 : _a.total_paid) || 0,
            };
        });
    }
    getPlans() {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`SELECT * FROM sm.plans WHERE is_active = true ORDER BY price ASC`);
            return rows;
        });
    }
    createSubscription(orgId, planId, providerSubId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                // Deactivate existing subscription
                yield client.query(`UPDATE sm.subscriptions SET status = 'CANCELLED' WHERE organization_id = $1 AND status = 'ACTIVE'`, [orgId]);
                const now = new Date();
                const end = new Date(now);
                end.setMonth(end.getMonth() + 1);
                const { rows } = yield client.query(`
        INSERT INTO sm.subscriptions (organization_id, plan_id, current_period_start, current_period_end, provider_subscription_id)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `, [orgId, planId, now.toISOString(), end.toISOString(), providerSubId || null]);
                yield client.query('COMMIT');
                return rows[0];
            }
            catch (err) {
                yield client.query('ROLLBACK');
                throw err;
            }
            finally {
                client.release();
            }
        });
    }
    getPayouts(orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = orgId ? `WHERE organization_id = $1` : '';
            const params = orgId ? [orgId] : [];
            const { rows } = yield db_1.default.query(`
      SELECT po.*, o.name AS org_name FROM sm.payouts po
      LEFT JOIN sm.organizations o ON po.organization_id = o.id
      ${q} ORDER BY po.created_at DESC LIMIT 50
    `, params);
            return rows;
        });
    }
}
exports.BillingRepository = BillingRepository;

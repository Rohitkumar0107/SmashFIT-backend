import pool from "../config/db";

export class PaymentRepository {
    async createCheckout(data: any) {
        const { rows } = await pool.query(`
      INSERT INTO sm.payments (user_id, organization_id, tournament_id, amount, currency, provider, provider_session_id, type, meta)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb) RETURNING *
    `, [data.user_id, data.organization_id, data.tournament_id, data.amount, data.currency || 'INR',
        data.provider || 'RAZORPAY', data.session_id, data.type || 'REGISTRATION', JSON.stringify(data.meta || {})]);
        return rows[0];
    }

    async findBySessionId(sessionId: string) {
        const { rows } = await pool.query(`SELECT * FROM sm.payments WHERE provider_session_id = $1`, [sessionId]);
        return rows[0] || null;
    }

    async findById(id: string) {
        const { rows } = await pool.query(`SELECT * FROM sm.payments WHERE id = $1`, [id]);
        return rows[0] || null;
    }

    async updateStatus(id: string, status: string, providerPaymentId?: string) {
        const { rows } = await pool.query(`
      UPDATE sm.payments SET status = $1, provider_payment_id = COALESCE($2, provider_payment_id), updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [status, providerPaymentId, id]);
        return rows[0];
    }

    async getHistory(userId?: string, orgId?: string, limit = 50) {
        let where = 'WHERE 1=1';
        const params: any[] = [];
        if (userId) { params.push(userId); where += ` AND p.user_id = $${params.length}`; }
        if (orgId) { params.push(orgId); where += ` AND p.organization_id = $${params.length}`; }
        params.push(limit);
        const { rows } = await pool.query(`
      SELECT p.*, u.full_name AS user_name, o.name AS org_name, t.name AS tournament_name
      FROM sm.payments p
      LEFT JOIN sm.users u ON p.user_id = u.id
      LEFT JOIN sm.organizations o ON p.organization_id = o.id
      LEFT JOIN sm.tournaments t ON p.tournament_id = t.id
      ${where} ORDER BY p.created_at DESC LIMIT $${params.length}
    `, params);
        return rows;
    }
}

export class BillingRepository {
    async getOrgBilling(orgId: string) {
        const [invoices, subscription, totals] = await Promise.all([
            pool.query(`SELECT * FROM sm.invoices WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 20`, [orgId]),
            pool.query(`
        SELECT s.*, p.name AS plan_name, p.price, p.interval
        FROM sm.subscriptions s LEFT JOIN sm.plans p ON s.plan_id = p.id
        WHERE s.organization_id = $1 AND s.status = 'ACTIVE' LIMIT 1
      `, [orgId]),
            pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total_paid FROM sm.payments
        WHERE organization_id = $1 AND status = 'COMPLETED'
      `, [orgId]),
        ]);
        return {
            invoices: invoices.rows,
            subscription: subscription.rows[0] || null,
            total_paid: totals.rows[0]?.total_paid || 0,
        };
    }

    async getPlans() {
        const { rows } = await pool.query(`SELECT * FROM sm.plans WHERE is_active = true ORDER BY price ASC`);
        return rows;
    }

    async createSubscription(orgId: string, planId: number, providerSubId?: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Deactivate existing subscription
            await client.query(`UPDATE sm.subscriptions SET status = 'CANCELLED' WHERE organization_id = $1 AND status = 'ACTIVE'`, [orgId]);
            const now = new Date();
            const end = new Date(now); end.setMonth(end.getMonth() + 1);
            const { rows } = await client.query(`
        INSERT INTO sm.subscriptions (organization_id, plan_id, current_period_start, current_period_end, provider_subscription_id)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `, [orgId, planId, now.toISOString(), end.toISOString(), providerSubId || null]);
            await client.query('COMMIT');
            return rows[0];
        } catch (err) { await client.query('ROLLBACK'); throw err; }
        finally { client.release(); }
    }

    async getPayouts(orgId?: string) {
        const q = orgId ? `WHERE organization_id = $1` : '';
        const params = orgId ? [orgId] : [];
        const { rows } = await pool.query(`
      SELECT po.*, o.name AS org_name FROM sm.payouts po
      LEFT JOIN sm.organizations o ON po.organization_id = o.id
      ${q} ORDER BY po.created_at DESC LIMIT 50
    `, params);
        return rows;
    }
}
